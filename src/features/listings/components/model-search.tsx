"use client";

import { Search, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  browseModelHref,
  matchModelsForSearch,
  type CatalogModel,
} from "@/lib/iphone-catalog";
import { cn } from "@/lib/utils";

type ModelSearchProps = {
  models: CatalogModel[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function ModelSearch({
  models,
  placeholder = "Buscar iPhone…",
  className,
  autoFocus = false,
}: ModelSearchProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const results = matchModelsForSearch(models, deferredQuery).slice(0, 8);
  const showResults = open && deferredQuery.trim().length > 0;
  const safeActiveIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function goToModel(modelId: string) {
    setOpen(false);
    setQuery("");
    router.push(browseModelHref(modelId));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (results[0]) {
      goToModel(results[0].id);
      return;
    }
    router.push("/explorar");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? 0 : (index + 1) % results.length,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0
          ? 0
          : (index - 1 + results.length) % results.length,
      );
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" && results[safeActiveIndex]) {
      event.preventDefault();
      goToModel(results[safeActiveIndex].id);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form onSubmit={onSubmit}>
        <label className="bg-background focus-within:ring-ring border-input flex h-11 items-center gap-2 rounded-xl border px-3 focus-within:ring-2">
          <Search
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
          />
          <span className="sr-only">Buscar modelo</span>
          <input
            type="search"
            role="combobox"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showResults}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
          />
        </label>
      </form>

      {showResults ? (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-popover absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-80 overflow-auto rounded-xl border shadow-lg"
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-3 text-sm">
              No encontramos ese modelo.{" "}
              <Link
                href="/explorar"
                className="text-foreground font-medium underline-offset-2 hover:underline"
                onClick={() => setOpen(false)}
              >
                Ver catálogo
              </Link>
            </li>
          ) : (
            results.map((model, index) => (
              <li
                key={model.id}
                role="option"
                aria-selected={index === safeActiveIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToModel(model.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                    index === safeActiveIndex
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/70",
                  )}
                >
                  <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Smartphone className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {model.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Ver anuncios
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
