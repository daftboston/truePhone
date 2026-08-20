"use client";

/**
 * @file file-input.tsx
 * @description Spanish file picker that hides native "Choose File" browser chrome.
 * @dependencies react, @/components/ui/button, @/lib/utils
 */

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  /** Visible gallery button copy. Defaults to "Elegir archivo". */
  buttonLabel?: string;
  /** Text when no file is selected. */
  emptyLabel?: string;
  /**
   * When set, shows a mobile-only «Tomar foto» control that opens the
   * system camera (`capture`). Hidden from `md` breakpoints.
   */
  cameraLabel?: string;
  /** Camera facing mode used by Tomar foto. */
  captureFacing?: "user" | "environment";
};

/**
 * assignFileToInput
 *
 * Copies a FileList onto a named input so the form submits the camera shot.
 *
 * @param target - Hidden named file input.
 * @param file - Selected image file.
 * @calledBy FileInput camera change handler
 */
function assignFileToInput(target: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  target.files = transfer.files;
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * FileInput
 *
 * Hides the native file control (browser-language "Choose File") and shows a
 * Spanish button plus the selected file name. Optional camera button for
 * Phase 19 mobile capture.
 *
 * @param props.buttonLabel - Visible gallery picker button text.
 * @param props.emptyLabel - Status text before a file is chosen.
 * @param props.cameraLabel - Mobile camera button; omit to hide Tomar foto.
 * @param props.captureFacing - `environment` (rear) or `user` (selfie).
 * @returns Accessible file control with Spanish chrome.
 * @calledBy Listing photo/possession forms and identity verification uploads
 */
const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      buttonLabel = "Elegir archivo",
      emptyLabel = "Ningún archivo seleccionado",
      cameraLabel,
      captureFacing = "environment",
      onChange,
      onInvalid,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    const cameraRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState("");

    /**
     * setRefs
     *
     * Forwards the hidden input to both the local ref and a parent ref.
     *
     * @param node - Native file input, or null on unmount.
     * @calledBy hidden input ref callback
     */
    function setRefs(node: HTMLInputElement | null) {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    const showCamera = Boolean(cameraLabel);

    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <input
          {...props}
          ref={setRefs}
          type="file"
          className="sr-only"
          onChange={(event) => {
            event.currentTarget.setCustomValidity("");
            setFileName(event.currentTarget.files?.[0]?.name ?? "");
            onChange?.(event);
          }}
          onInvalid={(event) => {
            if (event.currentTarget.validity.valueMissing) {
              event.currentTarget.setCustomValidity("Elige un archivo.");
            }
            onInvalid?.(event);
          }}
        />
        {showCamera ? (
          <input
            ref={cameraRef}
            type="file"
            accept={props.accept}
            capture={captureFacing}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              const named = innerRef.current;
              if (file && named) {
                assignFileToInput(named, file);
              }
              event.currentTarget.value = "";
            }}
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => innerRef.current?.click()}
        >
          {buttonLabel}
        </Button>
        {showCamera ? (
          <Button
            type="button"
            variant="outline"
            className="md:hidden"
            onClick={() => cameraRef.current?.click()}
          >
            {cameraLabel}
          </Button>
        ) : null}
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
          {fileName || emptyLabel}
        </span>
      </div>
    );
  },
);
FileInput.displayName = "FileInput";

export { FileInput };
