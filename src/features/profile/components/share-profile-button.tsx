"use client";

/**
 * @file share-profile-button.tsx
 * @description Client button that shares or copies a public profile URL.
 * @dependencies react, lucide-react, Button
 */

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShareProfileButtonProps = {
  path: string;
  title: string;
};

/**
 * ShareProfileButton
 *
 * Uses Web Share API when available, otherwise copies the profile URL.
 *
 * @param props.path - Relative public profile path (e.g. `/u/ana`).
 * @param props.title - Share title / clipboard context text.
 * @returns Outline share button with temporary "copied" feedback.
 * @calledBy public profile pages
 */
export function ShareProfileButton({ path, title }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * share
   *
   * Attempts native share, then falls back to clipboard copy.
   */
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
    <Button type="button" variant="outline" onClick={share}>
      {copied ? <Check /> : <Share2 />}
      {copied ? "Enlace copiado" : "Compartir perfil"}
    </Button>
  );
}
