import Link from "next/link";

import { ModelSearch } from "@/features/listings/components/model-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CatalogModel } from "@/lib/iphone-catalog";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  className?: string;
  isAuthenticated?: boolean;
  catalogModels?: CatalogModel[];
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
  isAuthenticated = false,
  catalogModels = [],
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
          <ModelSearch
            models={catalogModels}
            placeholder="Buscar…"
            className="[&_label]:h-10"
          />
        </div>
        <ThemeToggle />
        {isAuthenticated ? (
          <Button variant="ghost" size="icon" asChild aria-label="Tu perfil">
            <Link href="/perfil">
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
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        )}
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
          <Link
            href="/explorar"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Explorar
          </Link>
        </nav>

        <div className="mx-auto w-full max-w-md">
          <ModelSearch models={catalogModels} placeholder="Buscar iPhone…" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
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
