"use client";

/**
 * @file account-nav.tsx
 * @description Sidebar navigation for the authenticated account area (Mi TruePhone).
 * @dependencies next/link, lucide-react, LogoutButton, account-nav-active, @/lib/utils
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Heart,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Tags,
  UserRound,
  Wallet,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import {
  isAccountNavItemActive,
  type AccountNavActiveItem,
} from "@/features/profile/lib/account-nav-active";
import { cn } from "@/lib/utils";

type NavItem = AccountNavActiveItem & {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  badge?: number;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type AccountNavProps = {
  verificationHref: string;
  canReview?: boolean;
  isAdmin?: boolean;
  unreadMessages?: number;
  unreadNotifications?: number;
  className?: string;
};

/**
 * buildGroups
 *
 * Assembles nav groups for buying, selling, optional ops review, and account.
 *
 * @param verificationHref - Link into the identity verification flow.
 * @param canReview - When true, includes the operations review section.
 * @param isAdmin - When true, adds admin-only ops links (pagos, disputas, precios).
 * @param unreadMessages - Unread count badge for Mensajes.
 * @param unreadNotifications - Unread count badge for Notificaciones.
 * @returns Ordered nav groups for AccountNav.
 * @calledBy AccountNav
 */
function buildGroups(
  verificationHref: string,
  canReview: boolean,
  isAdmin: boolean,
  unreadMessages: number,
  unreadNotifications: number,
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
        {
          href: "/notificaciones",
          label: "Notificaciones",
          icon: Bell,
          badge: unreadNotifications,
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
          match: "verification",
        },
        { href: "/ventas", label: "Ventas", icon: Package },
        { href: "/pagos", label: "Pagos", icon: Wallet },
      ],
    },
  ];

  if (canReview) {
    const opsItems: NavItem[] = [
      {
        href: "/revision",
        label: "Centro de revisión",
        icon: ClipboardCheck,
        exact: true,
      },
      {
        href: "/revision/anuncios",
        label: "Cola de anuncios",
        icon: ClipboardList,
      },
      {
        href: "/revision/identidad",
        label: "Identidad",
        icon: BadgeCheck,
      },
      {
        href: "/revision/resenas",
        label: "Reseñas",
        icon: Star,
      },
    ];

    if (isAdmin) {
      opsItems.push(
        {
          href: "/revision/pagos",
          label: "Pagos",
          icon: CreditCard,
        },
        {
          href: "/revision/disputas",
          label: "Disputas",
          icon: ShieldAlert,
        },
        {
          href: "/revision/precios",
          label: "Precios",
          icon: Tags,
        },
      );
    }

    groups.push({
      title: "Operaciones",
      items: opsItems,
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

/**
 * formatBadge
 *
 * Caps unread badge display at "9+".
 *
 * @param count - Unread message count.
 * @returns Display string for the badge.
 * @calledBy AccountNav
 */
function formatBadge(count: number) {
  return count > 9 ? "9+" : String(count);
}

/**
 * AccountNav
 *
 * Renders grouped account navigation with active states and logout.
 *
 * @param props.verificationHref - Destination for the Verificación item.
 * @param props.canReview - Shows ops review nav when the user can moderate.
 * @param props.isAdmin - Adds admin-only ops destinations.
 * @param props.unreadMessages - Badge count on Mensajes.
 * @param props.unreadNotifications - Badge count on Notificaciones.
 * @param props.className - Optional classes on the nav root.
 * @returns Account sidebar navigation.
 * @calledBy AuthenticatedSidebarShell
 */
export function AccountNav({
  verificationHref,
  canReview = false,
  isAdmin = false,
  unreadMessages = 0,
  unreadNotifications = 0,
  className,
}: AccountNavProps) {
  const pathname = usePathname();
  const groups = buildGroups(
    verificationHref,
    canReview,
    isAdmin,
    unreadMessages,
    unreadNotifications,
  );

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
              const active = isAccountNavItemActive(pathname, item);

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
