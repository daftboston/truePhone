"use client";

/**
 * @file avatar-upload-form.tsx
 * @description Client form that auto-submits a selected avatar image.
 * @dependencies react, uploadAvatarAction, Avatar, Button
 */

import { useActionState, useRef } from "react";

import { uploadAvatarAction } from "@/features/profile/actions/profile";
import type { ProfileActionState } from "@/features/profile/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type AvatarUploadFormProps = {
  fullName: string | null;
  avatarUrl: string | null;
};

/**
 * initials
 *
 * Derives up to two uppercase initials from a display name.
 *
 * @param name - Full name or null.
 * @returns Initials string, or `"?"` when name is empty.
 * @calledBy AvatarUploadForm
 */
function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * AvatarUploadForm
 *
 * Shows the current avatar and uploads a new file via uploadAvatarAction.
 *
 * @param props.fullName - Used for fallback initials.
 * @param props.avatarUrl - Current public avatar URL, if any.
 * @returns Avatar preview plus file picker button with status messages.
 * @calledBy profile edit page
 */
export function AvatarUploadForm({
  fullName,
  avatarUrl,
}: AvatarUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(uploadAvatarAction, null);

  return (
    <form action={formAction} className="flex items-center gap-4">
      <Avatar className="size-16">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials(fullName)}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <input
          ref={inputRef}
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            if (event.currentTarget.files?.length) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={pending}
          onClick={() => inputRef.current?.click()}
        >
          Cambiar foto
        </Button>
        <p className="text-muted-foreground text-xs">
          JPG, PNG o WebP · máx. 2 MB
        </p>
        {state?.ok === true ? (
          <p className="text-success text-xs" role="status">
            {state.message}
          </p>
        ) : null}
        {state?.ok === false ? (
          <p className="text-destructive text-xs" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
