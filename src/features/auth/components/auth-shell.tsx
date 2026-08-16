/**
 * @file auth-shell.tsx
 * @description Layout wrapper for auth pages with brand header, card, and optional footer.
 * @dependencies next/link, @/lib/utils
 */

import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * AuthShell
 *
 * Renders a centered auth page shell with TruePhone branding and a content card.
 *
 * @param props.title - Page heading below the brand link.
 * @param props.description - Short supporting copy under the title.
 * @param props.children - Form or other auth content inside the card.
 * @param props.footer - Optional links below the card (e.g. switch login/register).
 * @param props.className - Optional extra classes on the outer gradient container.
 * @returns Auth page layout.
 * @calledBy login, register, recover, and update-password app pages
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "from-background via-background to-accent/40 flex min-h-full flex-1 flex-col bg-gradient-to-b",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            TruePhone
          </Link>
          <h1 className="text-foreground mt-6 text-xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        </div>

        <div className="bg-card border-border rounded-xl border p-5 shadow-[var(--shadow-card)] sm:p-6">
          {children}
        </div>

        {footer ? (
          <div className="text-muted-foreground mt-6 text-center text-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
