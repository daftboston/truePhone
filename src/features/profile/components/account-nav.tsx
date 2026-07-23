"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ClipboardCheck,
  Heart,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

type NavItem = {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  soon?: boolean;
  exact?: boolean;
  badge?: number;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type AccountNavProps = {
  verificationHref: string;
  canReview?: boolean;
  unreadMessages?: number;
  className?: string;
};

function buildGroups(
  verificationHref: string,
  canReview: boolean,
  unreadMessages: number,
): NavGroup[] {
  const groups: NavGroup[] = [
    {
      title: "Comprando",
      items: [
        { href: "/compras", label: "Compras", icon: ShoppingBag },
        {
          href: "/mensajes",
          label: "Mensajes",
          icon: MessageSquare,
          badge: unreadMessages,
        },
        { href: "/favoritos", label: "Favoritos", icon: Heart },
        { label: "Direcciones", icon: MapPin, soon: true },
      ],
    },
    {
      title: "Vendiendo",
      items: [
        { href: "/vender", label: "Mis anuncios", icon: Store },
        {
          href: verificationHref,
          label: "Verificación",
          icon: ShieldCheck,
        },
        { href: "/ventas", label: "Ventas", icon: Package },
        { label: "Pagos", icon: Wallet, soon: true },
      ],
    },
  ];

  if (canReview) {
    groups.push({
      title: "Operaciones",
      items: [
        {
          href: "/revision",
          label: "Revisión",
          icon: ClipboardCheck,
        },
      ],
    });
  }

  groups.push({
    title: "Cuenta",
    items: [
      { href: "/perfil", label: "Resumen", icon: UserRound, exact: true },
      { href: "/perfil/editar", label: "Editar perfil", icon: Pencil },
    ],
  });

  return groups;
}

function isActive(pathname: string, item: NavItem) {
  if (!item.href || item.soon) return false;
  if (item.exact) return pathname === item.href;
  // Mis anuncios: only the list page, not wizard/detail routes.
  if (item.href === "/vender") {
    return pathname === "/vender";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function formatBadge(count: number) {
  return count > 9 ? "9+" : String(count);
}

export function AccountNav({
  verificationHref,
  canReview = false,
  unreadMessages = 0,
  className,
}: AccountNavProps) {
  const pathname = usePathname();
  const groups = buildGroups(verificationHref, canReview, unreadMessages);

  return (
    <nav aria-label="Mi TruePhone" className={cn("space-y-6", className)}>
      <div>
        <p className="text-foreground text-lg font-semibold tracking-tight">
          Mi TruePhone
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Compra, vende y gestiona tu cuenta.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wide uppercase">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);

              if (item.soon || !item.href) {
                return (
                  <li key={item.label}>
                    <span
                      className="text-muted-foreground flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm opacity-60"
                      aria-disabled="true"
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-medium tracking-wide uppercase">
                        Pronto
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {item.badge && item.badge > 0 ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                          active
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {formatBadge(item.badge)}
                      </span>
                    ) : (
                      <ChevronRight
                        className={cn(
                          "size-4 shrink-0 opacity-50",
                          active && "opacity-80",
                        )}
                        aria-hidden
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="pt-1">
        <LogoutButton />
      </div>
    </nav>
  );
}
