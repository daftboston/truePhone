"use client";

/**
 * @file identity-capture-frame.tsx
 * @description Document/selfie capture frame with local and signed previews.
 * @dependencies react, @/components/ui/file-input, @/lib/utils
 */

import { useEffect, useState } from "react";

import { FileInput } from "@/components/ui/file-input";
import { cn } from "@/lib/utils";

type IdentityCaptureFrameProps = {
  variant: "cedula" | "selfie";
  inputId: string;
  inputName: string;
  label: string;
  why: string;
  how?: string;
  existingImageUrl?: string | null;
  captureFacing?: "user" | "environment";
  cameraPrimary?: boolean;
  required?: boolean;
};

/**
 * IdentityCaptureFrame
 *
 * Shows a cédula rectangle or selfie oval, optimistic local preview, and
 * the gallery/camera FileInput.
 *
 * @param props.variant - Frame shape.
 * @param props.inputId - File input id.
 * @param props.inputName - Form field name.
 * @param props.label - Visible capture label.
 * @param props.why - Why TruePhone needs this photo.
 * @param props.how - Optional how-to tip.
 * @param props.existingImageUrl - Signed URL of a saved photo.
 * @param props.captureFacing - Camera facing mode.
 * @param props.cameraPrimary - Primary Tomar foto on mobile.
 * @param props.required - Native required when no existing photo.
 * @returns Capture frame and file controls.
 * @calledBy CedulaFrontForm, CedulaBackForm, SelfieForm
 */
export function IdentityCaptureFrame({
  variant,
  inputId,
  inputName,
  label,
  why,
  how,
  existingImageUrl = null,
  captureFacing = "environment",
  cameraPrimary = false,
  required = false,
}: IdentityCaptureFrameProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const previewUrl = localPreview ?? existingImageUrl;

  /**
   * handlePreviewReady
   *
   * Replaces the object-URL preview when the seller picks a new file.
   *
   * @param file - Compressed image ready for form submit.
   * @calledBy FileInput onPreviewReady
   */
  function handlePreviewReady(file: File) {
    setLocalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "border-border bg-muted/40 relative overflow-hidden border border-dashed",
          variant === "selfie"
            ? "mx-auto aspect-square max-w-xs rounded-full"
            : "aspect-[1.586] rounded-xl",
        )}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob or signed URL */}
            <img
              src={previewUrl}
              alt={label}
              className={cn(
                "size-full object-cover",
                variant === "selfie" && "rounded-full",
              )}
            />
            <span className="bg-success text-success-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              Listo
            </span>
          </>
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="text-foreground text-sm font-medium">{label}</p>
          </div>
        )}
      </div>
      {previewUrl ? (
        <p className="text-muted-foreground text-xs">
          {localPreview
            ? "Vista previa. Continúa para guardar."
            : "Foto guardada. Puedes cambiarla antes de continuar."}
        </p>
      ) : null}
      <p className="text-muted-foreground text-sm">{why}</p>
      {how ? <p className="text-muted-foreground text-xs">{how}</p> : null}
      <FileInput
        id={inputId}
        name={inputName}
        accept="image/jpeg,image/png,image/webp"
        required={required && !existingImageUrl}
        buttonLabel="Elegir de la galería"
        cameraLabel="Tomar foto"
        captureFacing={captureFacing}
        cameraPrimary={cameraPrimary}
        hideFileName
        onPreviewReady={handlePreviewReady}
      />
    </div>
  );
}
