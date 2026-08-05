"use server";

/**
 * @file profile.ts
 * @description Server actions for profile edit, avatar upload, and password change.
 * @dependencies next/cache, next/navigation, profile schemas/types, prisma, Supabase storage
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/features/profile/schemas/profile";
import {
  fieldErrorsFromZod,
  type ProfileActionState,
} from "@/features/profile/types";
import { ensureProfile } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const AVATARS_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * emptyToNull
 *
 * Converts empty/whitespace strings to null for optional Prisma fields.
 *
 * @param value - Optional string from form input.
 * @returns Trimmed string or null.
 * @calledBy updateProfileAction
 */
function emptyToNull(value: string | undefined) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

/**
 * updateProfileAction
 *
 * Updates the authenticated user's profile and redirects to `/perfil`.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - fullName, username, location, bio, phone fields.
 * @returns ProfileActionState on auth/validation/uniqueness errors; redirects on success.
 * @calledBy ProfileEditForm
 */
export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para editar tu perfil." };
  }

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username") || "",
    department: formData.get("department") || "",
    cityOption: formData.get("cityOption") || "",
    cityDetail: formData.get("cityDetail") || "",
    bio: formData.get("bio") || "",
    phone: formData.get("phone") || "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const profile = await ensureProfile({
    authUserId: user.id,
    fullName: parsed.data.fullName,
  });

  const username = emptyToNull(parsed.data.username)?.toLowerCase() ?? null;

  // Enforce unique username across profiles
  if (username) {
    const taken = await prisma.profile.findFirst({
      where: {
        username,
        NOT: { id: profile.id },
      },
      select: { id: true },
    });
    if (taken) {
      return {
        ok: false,
        error: "Ese nombre de usuario ya está en uso.",
        fieldErrors: { username: ["Ese nombre de usuario ya está en uso."] },
      };
    }
  }

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName: parsed.data.fullName,
      username,
      city: emptyToNull(parsed.data.city),
      department: emptyToNull(parsed.data.department),
      bio: emptyToNull(parsed.data.bio),
      phone: emptyToNull(parsed.data.phone),
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
  if (updated.username) {
    revalidatePath(`/u/${updated.username}`);
  }

  redirect("/perfil");
}

/**
 * uploadAvatarAction
 *
 * Uploads an avatar to Supabase Storage and stores the public URL on the profile.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - `avatar` file field (JPEG/PNG/WebP, max 2 MB).
 * @returns ProfileActionState with success message or validation/upload error.
 * @calledBy AvatarUploadForm
 */
export async function uploadAvatarAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para subir una foto." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona una imagen." };
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Usa una imagen JPG, PNG o WebP.",
    };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: "La imagen debe pesar máximo 2 MB.",
    };
  }

  const profile = await ensureProfile({ authUserId: user.id });
  const extension = file.type.split("/")[1] ?? "jpg";
  const objectPath = `${user.id}/${Date.now()}.${extension}`;

  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      ok: false,
      error:
        "No pudimos subir la foto. Confirma que el bucket «avatars» existe en Supabase Storage.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(objectPath);

  await prisma.profile.update({
    where: { id: profile.id },
    data: { avatarUrl: publicUrl },
  });

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
  if (profile.username) {
    revalidatePath(`/u/${profile.username}`);
  }

  return { ok: true, message: "Foto de perfil actualizada." };
}

/**
 * changePasswordAction
 *
 * Updates the authenticated user's Supabase Auth password.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - password, confirmPassword.
 * @returns ProfileActionState with success message or validation/auth error.
 * @calledBy ChangePasswordForm
 */
export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      error: "No pudimos actualizar la contraseña. Intenta de nuevo.",
    };
  }

  return { ok: true, message: "Tu contraseña ha sido actualizada." };
}
