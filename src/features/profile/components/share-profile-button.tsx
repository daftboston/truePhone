"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShareProfileButtonProps = {
  path: string;
  title: string;
};

export function ShareProfileButton({ path, title }: ShareProfileButtonProps) {
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
    <Button type="button" variant="outline" onClick={share}>
      {copied ? <Check /> : <Share2 />}
      {copied ? "Enlace copiado" : "Compartir perfil"}
    </Button>
  );
}
