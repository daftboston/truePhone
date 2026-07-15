import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  className?: string;
  cartHref?: string;
};

export function AppHeader({ className, cartHref = "#" }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background/95 border-border sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur",
        className,
      )}
    >
      <Link
        href="/"
        className="text-foreground text-base font-semibold tracking-tight"
      >
        TruePhone
      </Link>
      <Button variant="ghost" size="icon" asChild aria-label="Carrito">
        <Link href={cartHref}>
          <ShoppingCart />
        </Link>
      </Button>
    </header>
  );
}
