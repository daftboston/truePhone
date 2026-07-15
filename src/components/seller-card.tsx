import { TrustBadge } from "@/components/trust-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SellerCardProps = {
  name: string;
  avatarUrl?: string;
  verified?: boolean;
  subtitle?: string;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SellerCard({
  name,
  avatarUrl,
  verified = false,
  subtitle,
  className,
}: SellerCardProps) {
  return (
    <div
      className={cn(
        "border-border flex items-center gap-3 rounded-xl border p-3",
        className,
      )}
    >
      <Avatar>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground truncate text-sm font-semibold">
            {name}
          </p>
          {verified && <TrustBadge />}
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
