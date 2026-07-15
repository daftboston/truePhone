import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchBarProps = {
  placeholder?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
};

export function SearchBar({
  placeholder = "Buscar iPhone…",
  name = "q",
  defaultValue,
  className,
}: SearchBarProps) {
  return (
    <label
      className={cn(
        "bg-background focus-within:ring-ring border-input flex h-11 items-center gap-2 rounded-xl border px-3 focus-within:ring-2",
        className,
      )}
    >
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
  );
}
