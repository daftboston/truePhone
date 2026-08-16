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
  /** Visible button copy. Defaults to "Elegir archivo". */
  buttonLabel?: string;
  /** Text when no file is selected. */
  emptyLabel?: string;
};

/**
 * FileInput
 *
 * Hides the native file control (browser-language "Choose File") and shows a
 * Spanish button plus the selected file name.
 *
 * @param props.buttonLabel - Visible picker button text.
 * @param props.emptyLabel - Status text before a file is chosen.
 * @returns Accessible file control with Spanish chrome.
 * @calledBy Listing photo/possession forms and identity verification uploads
 */
const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      buttonLabel = "Elegir archivo",
      emptyLabel = "Ningún archivo seleccionado",
      onChange,
      onInvalid,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
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
        <Button
          type="button"
          variant="outline"
          onClick={() => innerRef.current?.click()}
        >
          {buttonLabel}
        </Button>
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
          {fileName || emptyLabel}
        </span>
      </div>
    );
  },
);
FileInput.displayName = "FileInput";

export { FileInput };
