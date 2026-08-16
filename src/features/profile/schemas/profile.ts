/**
 * @file profile.ts
 * @description Zod schemas for profile edit and in-account password change.
 * @dependencies zod, @/lib/locations/colombia-cities
 */

import { z } from "zod";

import {
  cityOptionNeedsDetail,
  COLOMBIA_DEPARTMENT_OPTIONS,
  DEPARTMENT_BOGOTA_DC,
  resolvePersistedCity,
} from "@/lib/locations/colombia-cities";

/** Public username: lowercase alphanumeric + underscore, 3–24 chars. */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El usuario debe tener al menos 3 caracteres.")
  .max(24, "El usuario es demasiado largo.")
  .regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guion bajo.");

const departmentSchema = z.union([
  z.enum(COLOMBIA_DEPARTMENT_OPTIONS),
  z.literal(""),
]);

/**
 * Validates profile edit fields and resolves persisted city from department/option/detail.
 */
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Ingresa tu nombre.")
      .max(80, "El nombre es demasiado largo."),
    username: usernameSchema.or(z.literal("")).optional(),
    department: departmentSchema.optional(),
    cityOption: z.string().trim().max(80).optional().or(z.literal("")),
    cityDetail: z.string().trim().max(80).optional().or(z.literal("")),
    /** Resolved city persisted to Profile.city (server-set from option + detail). */
    city: z.string().trim().max(80).optional().or(z.literal("")),
    bio: z
      .string()
      .trim()
      .max(280, "La biografía puede tener máximo 280 caracteres.")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(20, "El teléfono es demasiado largo.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const department = data.department ?? "";
    const cityOption =
      department === DEPARTMENT_BOGOTA_DC ? "Bogotá" : (data.cityOption ?? "");
    const cityDetail = data.cityDetail ?? "";

    if (department && department !== DEPARTMENT_BOGOTA_DC && !cityOption) {
      ctx.addIssue({
        code: "custom",
        path: ["cityOption"],
        message: "Selecciona tu ciudad.",
      });
    }

    if (cityOptionNeedsDetail(cityOption) && !cityDetail.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["cityDetail"],
        message:
          cityOption === "Alrededores de Bogotá"
            ? "Escribe el municipio o zona (ej. Soacha, Chía)."
            : "Escribe el nombre de tu ciudad.",
      });
    }
  })
  .transform((data) => {
    const department = data.department ?? "";
    const cityOption =
      department === DEPARTMENT_BOGOTA_DC ? "Bogotá" : (data.cityOption ?? "");
    const cityDetail = data.cityDetail ?? "";
    return {
      ...data,
      department,
      city: resolvePersistedCity({ department, cityOption, cityDetail }),
    };
  });

/** Validates new password + confirmation for logged-in password change. */
export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
