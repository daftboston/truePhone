"use client";

/**
 * @file faq-list.tsx
 * @description Client FAQ filter: type-to-narrow clusters without leaving /ayuda.
 * @dependencies lucide-react, react, EmptyState, Input, FAQ types, filterFaqClusters
 */

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FaqCluster } from "@/lib/help/faq";
import { filterFaqClusters } from "@/lib/help/filter-faq";
import { LEGAL_CONTACT_EMAIL, LEGAL_CONTACT_MAILTO } from "@/lib/legal";
import { cn } from "@/lib/utils";

type FaqListProps = {
  clusters: FaqCluster[];
};

/**
 * FaqList
 *
 * Filters FAQ clusters as the reader types. Chip anchors and details stay.
 *
 * @param props.clusters - Canonical FAQ groups from the server page.
 * @returns Search field, topic chips, and matching Q&A.
 * @calledBy AyudaPage
 */
export function FaqList({ clusters }: FaqListProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [activeHash, setActiveHash] = useState("");
  const visible = useMemo(
    () => filterFaqClusters(clusters, query),
    [clusters, query],
  );

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(window.location.hash.replace(/^#/, ""));
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <label htmlFor={searchId} className="sr-only">
          Buscar en la ayuda
        </label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar una pregunta…"
            autoComplete="off"
            className="pl-9"
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <nav
          aria-label="Temas de ayuda"
          className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2"
        >
          {visible.map((cluster) => (
            <Link
              key={cluster.id}
              href={`#${cluster.id}`}
              aria-current={activeHash === cluster.id ? "location" : undefined}
              className={cn(
                "border-border bg-muted/40 text-foreground hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeHash === cluster.id && "bg-muted ring-border ring-1",
              )}
            >
              {cluster.title}
            </Link>
          ))}
        </nav>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title="No encontramos esa pregunta"
          description={`Prueba con otras palabras o escribe a ${LEGAL_CONTACT_EMAIL}.`}
          action={
            <Button asChild>
              <a href={LEGAL_CONTACT_MAILTO}>Escribe a {LEGAL_CONTACT_EMAIL}</a>
            </Button>
          }
        />
      ) : (
        <div className="mx-auto w-full max-w-2xl space-y-10">
          {visible.map((cluster) => (
            <section
              key={cluster.id}
              id={cluster.id}
              className="scroll-mt-28 space-y-4 md:scroll-mt-32"
            >
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                {cluster.title}
              </h2>
              <ul className="space-y-3">
                {cluster.items.map((item) => (
                  <li key={item.question}>
                    <details className="group border-border bg-card rounded-xl border">
                      <summary className="text-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex cursor-pointer list-none items-start justify-between gap-3 rounded-xl px-4 py-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                        <span className="pr-1 text-pretty">
                          {item.question}
                        </span>
                        <ChevronDown
                          className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                      </summary>
                      <div className="border-border space-y-3 border-t px-4 pt-3 pb-4">
                        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                          {item.answer}
                        </p>
                        {item.links && item.links.length > 0 ? (
                          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                            {item.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="text-trust font-medium underline-offset-4 hover:underline"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
