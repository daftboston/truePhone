"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Home,
  Search,
  PlusCircle,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const baseItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/vender", label: "Vender", icon: PlusCircle },
  { href: "/compras", label: "Compras", icon: ShoppingBag },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const;

type BottomNavProps = {
  className?: string;
  showReview?: boolean;
};

export function BottomNav({ className, showReview = false }: BottomNavProps) {
  const pathname = usePathname();
  const items = showReview
    ? [
        baseItems[0],
        baseItems[1],
        baseItems[2],
        {
          href: "/revision",
          label: "Revisión",
          icon: ClipboardCheck,
        } as const,
        baseItems[4],
      ]
    : baseItems;

  return (
    <nav
      className={cn(
        "bg-background border-border fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden",
        className,
      )}
      aria-label="Navegación principal"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/revision"
                ? pathname.startsWith("/revision")
                : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("size-5", active && "text-primary")}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
