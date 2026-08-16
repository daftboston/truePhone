/**
 * @file search-bar.tsx
 * @description GET form search input that posts to /buscar with optional hidden filters.
 * @dependencies lucide-react, @/lib/utils
 */

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchBarProps = {
  placeholder?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
  action?: string;
  /** Extra GET fields preserved on submit (e.g. active browse filters). */
  hiddenFields?: Record<string, string>;
};

/**
 * SearchBar
 *
 * Submits a search query (and optional preserved filters) via GET.
 *
 * @param props.placeholder - Input placeholder.
 * @param props.name - Query param name; defaults to q.
 * @param props.defaultValue - Initial query value.
 * @param props.action - Form action path; defaults to /buscar.
 * @param props.hiddenFields - Extra GET fields preserved on submit.
 * @param props.className - Wrapper className.
 * @returns Accessible search form.
 * @calledBy Explore, search, and header search surfaces
 */
export function SearchBar({
  placeholder = "Buscar iPhone…",
  name = "q",
  defaultValue,
  className,
  action = "/buscar",
  hiddenFields,
}: SearchBarProps) {
  return (
    <form action={action} method="get" className={cn("w-full", className)}>
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) =>
            value ? (
              <input key={key} type="hidden" name={key} value={value} />
            ) : null,
          )
        : null}
      <label className="bg-background focus-within:ring-ring border-input flex h-11 items-center gap-2 rounded-xl border px-3 focus-within:ring-2">
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <span className="sr-only">Buscar</span>
        <input
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
        />
      </label>
    </form>
  );
}
