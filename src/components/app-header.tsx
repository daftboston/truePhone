import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { href: "/buscar", label: "Explorar" },
  { href: "/vender", label: "Vender" },
  { href: "/compras", label: "Compras" },
] as const;

type AppHeaderProps = {
  className?: string;
  cartHref?: string;
  isAuthenticated?: boolean;
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
};

function initials(name: string | null | undefined) {
  if (!name) return "TP";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppHeader({
  className,
  cartHref = "/compras",
  isAuthenticated = false,
  user = null,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background/95 border-border sticky top-0 z-40 border-b backdrop-blur",
        className,
      )}
    >
      {/* Mobile */}
      <div className="flex h-14 items-center gap-3 px-4 md:hidden">
        <Link
          href="/"
          className="text-foreground shrink-0 text-base font-semibold tracking-tight"
        >
          TruePhone
        </Link>
        <div className="min-w-0 flex-1">
          <SearchBar placeholder="Buscar…" className="h-10" />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild aria-label="Carrito">
          <Link href={cartHref}>
            <ShoppingCart />
          </Link>
        </Button>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden h-16 max-w-7xl items-center gap-8 px-6 md:flex">
        <Link
          href="/"
          className="text-foreground shrink-0 text-lg font-semibold tracking-tight"
        >
          TruePhone
        </Link>

        <nav className="flex items-center gap-6" aria-label="Principal">
          {desktopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mx-auto w-full max-w-md">
          <SearchBar placeholder="Buscar iPhone…" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild aria-label="Carrito">
            <Link href={cartHref}>
              <ShoppingCart />
            </Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild className="gap-2 px-2">
                <Link href="/perfil" aria-label="Tu perfil">
                  <Avatar className="size-7">
                    {user?.avatarUrl ? (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.fullName ?? "Perfil"}
                      />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {initials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-28 truncate">
                    {user?.fullName?.split(" ")[0] ?? "Perfil"}
                  </span>
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/vender">Vender</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/registro">Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
