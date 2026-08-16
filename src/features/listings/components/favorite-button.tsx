"use client";

/**
 * @file favorite-button.tsx
 * @description FavoriteButton component for the listings feature.tsx.
 * @dependencies lucide-react, next/navigation, react, @/components/ui/button, @/features/listings/actions/favorites
 */

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/features/listings/actions/favorites";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  listingId: string;
  initialFavorited: boolean;
  loginHref: string;
  className?: string;
  fullWidth?: boolean;
};

/**
 * FavoriteButton
 *
 * Renders the Favorite Button UI for listings.
 *
 * @param props - FavoriteButton props.
 * @returns FavoriteButton React element.
 * @calledBy listings pages and parent components
 */
export function FavoriteButton({
  listingId,
  initialFavorited,
  loginHref,
  className,
  fullWidth = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleFavoriteAction(listingId);
      if (!result.ok) {
        if (result.loginRequired) {
          router.push(loginHref);
          return;
        }
        setError(result.error);
        return;
      }
      setFavorited(result.favorited);
    });
  }

  return (
    <div className={cn("space-y-1", fullWidth && "w-full", className)}>
      <Button
        type="button"
        variant="outline"
        fullWidth={fullWidth}
        disabled={pending}
        onClick={onToggle}
        aria-pressed={favorited}
        aria-label={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        <Heart
          className={cn(
            "size-4",
            favorited && "fill-destructive text-destructive",
          )}
          aria-hidden
        />
        {favorited ? "Guardado" : "Guardar"}
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
