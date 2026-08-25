"use client";

/**
 * @file file-input.tsx
 * @description Spanish file picker that hides native "Choose File" browser chrome.
 * @dependencies react, @/components/ui/button, @/lib/images/compress-image, @/lib/utils
 */

import * as React from "react";

import { Button } from "@/components/ui/button";
import { compressImageForUpload } from "@/lib/images/compress-image";
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
  /**
   * Compress large images before submit (default true). Keeps Server Action
   * bodies under Next’s bodySizeLimit when phone camera files are multi‑MB.
   */
  compressImages?: boolean;
  /**
   * Called with the prepared file after compression. Use for auto-upload
   * flows that should not require a separate submit click.
   */
  onFileReady?: (file: File) => void;
  /** Hide the selected-file name (useful when upload starts immediately). */
  hideFileName?: boolean;
};

/**
 * setInputFile
 *
 * Replaces the file list on an input without firing another change event.
 *
 * @param target - Named file input bound to the form.
 * @param file - File to submit.
 * @calledBy FileInput after compression
 */
function setInputFile(target: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  target.files = transfer.files;
}

/**
 * FileInput
 *
 * Hides the native file control (browser-language "Choose File") and shows a
 * Spanish button plus the selected file name. Optional camera button for
 * Phase 19 mobile capture. Large photos are compressed before submit so
 * Server Actions do not hit the default 1 MB body limit.
 *
 * @param props.buttonLabel - Visible gallery picker button text.
 * @param props.emptyLabel - Status text before a file is chosen.
 * @param props.cameraLabel - Mobile camera button; omit to hide Tomar foto.
 * @param props.captureFacing - `environment` (rear) or `user` (selfie).
 * @param props.compressImages - When false, skips client JPEG compression.
 * @param props.onFileReady - Optional callback after the file is ready to upload.
 * @param props.hideFileName - When true, omits the filename status text.
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
      compressImages = true,
      onFileReady,
      hideFileName = false,
      onChange,
      onInvalid,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    const cameraRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState("");
    const [preparing, setPreparing] = React.useState(false);

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

    /**
     * prepareFile
     *
     * Compresses the file when enabled and updates the named input + label.
     *
     * @param file - Raw file from gallery or camera.
     * @param named - Form-bound file input.
     * @returns Prepared file ready for submit.
     * @calledBy gallery and camera change handlers
     */
    async function prepareFile(file: File, named: HTMLInputElement) {
      setPreparing(true);
      try {
        const ready = compressImages
          ? await compressImageForUpload(file)
          : file;
        setInputFile(named, ready);
        setFileName(ready.name);
        onFileReady?.(ready);
        return ready;
      } finally {
        setPreparing(false);
      }
    }

    /**
     * resetSelection
     *
     * Clears the named input so the same file can be chosen again.
     *
     * @calledBy Auto-upload callers via imperative handle when needed
     */
    function resetSelection() {
      if (innerRef.current) {
        innerRef.current.value = "";
      }
      setFileName("");
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
            const file = event.currentTarget.files?.[0];
            const named = event.currentTarget;
            if (!file) {
              setFileName("");
              onChange?.(event);
              return;
            }
            void (async () => {
              await prepareFile(file, named);
              onChange?.(event);
              if (onFileReady) {
                resetSelection();
              }
            })();
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
                void (async () => {
                  await prepareFile(file, named);
                  if (onFileReady) {
                    resetSelection();
                  }
                })();
              }
              event.currentTarget.value = "";
            }}
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={preparing || props.disabled}
          onClick={() => innerRef.current?.click()}
        >
          {preparing ? "Preparando…" : buttonLabel}
        </Button>
        {showCamera ? (
          <Button
            type="button"
            variant="outline"
            className="md:hidden"
            disabled={preparing || props.disabled}
            onClick={() => cameraRef.current?.click()}
          >
            {cameraLabel}
          </Button>
        ) : null}
        {hideFileName ? null : (
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
            {preparing ? "Comprimiendo foto…" : fileName || emptyLabel}
          </span>
        )}
      </div>
    );
  },
);
FileInput.displayName = "FileInput";

export { FileInput };
