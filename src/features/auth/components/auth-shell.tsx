import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

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
