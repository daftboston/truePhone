"use client";

/**
 * @file share-listing-button.tsx
 * @description ShareListingButton component for the listings feature.tsx.
 * @dependencies lucide-react, react, @/components/ui/button
 */

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ShareListingButtonProps = {
  path: string;
  title: string;
  fullWidth?: boolean;
};

/**
 * ShareListingButton
 *
 * Renders the Share Listing Button UI for listings.
 *
 * @param props - ShareListingButton props.
 * @returns ShareListingButton React element.
 * @calledBy listings pages and parent components
 */
export function ShareListingButton({
  path,
  title,
  fullWidth = false,
}: ShareListingButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url, text: title });
        return;
      } catch {
        // Cancelled or unsupported — copy instead.
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      fullWidth={fullWidth}
      onClick={share}
      aria-label="Compartir anuncio"
    >
      {copied ? <Check /> : <Share2 />}
      {copied ? "Enlace copiado" : "Compartir"}
    </Button>
  );
}
