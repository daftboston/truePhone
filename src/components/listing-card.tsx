import Image from "next/image";
import Link from "next/link";

import { TrustBadge } from "@/components/trust-badge";
import { PriceDisplay } from "@/components/price-display";
import { cn } from "@/lib/utils";

type ListingCardProps = {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  price: number;
  batteryHealth?: number;
  verified?: boolean;
  conditionLabel?: string;
  className?: string;
};

export function ListingCard({
  href,
  title,
  imageUrl,
  imageAlt = title,
  price,
  batteryHealth,
  verified = false,
  conditionLabel,
  className,
}: ListingCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-card text-card-foreground border-border block overflow-hidden rounded-xl border transition-opacity hover:opacity-95",
        className,
      )}
    >
      <div className="bg-muted relative aspect-[4/5] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 240px"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Sin foto
          </div>
        )}
        {verified && (
          <div className="absolute top-2 left-2">
            <TrustBadge />
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="text-foreground line-clamp-1 text-sm font-semibold">
          {title}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          {batteryHealth != null && <span>Batería {batteryHealth}%</span>}
          {conditionLabel && <span>{conditionLabel}</span>}
        </div>
        <PriceDisplay price={price} className="[&>p]:text-base" />
      </div>
    </Link>
  );
}
