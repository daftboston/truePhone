import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type ReviewQueueRowProps = {
  href: string;
  title: string;
  sellerName: string;
  submittedAt: string;
  imageUrl?: string;
  statusLabel?: string;
  className?: string;
};

export function ReviewQueueRow({
  href,
  title,
  sellerName,
  submittedAt,
  imageUrl,
  statusLabel,
  className,
}: ReviewQueueRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-muted/60 border-border flex items-center gap-3 border-b px-1 py-3 transition-colors",
        className,
      )}
    >
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">
          {title}
        </p>
        <p className="text-muted-foreground truncate text-xs">{sellerName}</p>
        <p className="text-muted-foreground text-xs">{submittedAt}</p>
      </div>
      {statusLabel && (
        <span className="text-muted-foreground shrink-0 text-xs font-medium">
          {statusLabel}
        </span>
      )}
    </Link>
  );
}
