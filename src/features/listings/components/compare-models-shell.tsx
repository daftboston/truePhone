"use client";

/**
 * @file compare-models-shell.tsx
 * @description Interactive model pickers and comparison view for /comparar.
 * @dependencies next/navigation, model-compare-view, ui/select, ui/label
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

import {
  ModelCompareView,
  type CompareModelEntry,
} from "@/components/model-compare-view";
import { EmptyState } from "@/components/empty-state";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CompareModelOption = {
  slug: string;
  name: string;
  entry: CompareModelEntry;
};

type CompareModelsShellProps = {
  models: CompareModelOption[];
  initialLeftSlug?: string;
  initialRightSlug?: string;
  className?: string;
};

/**
 * buildCompareHref
 *
 * Builds a shareable compare URL from two model slugs.
 *
 * @param pathname - Current compare route pathname.
 * @param leftSlug - Left model slug or empty string.
 * @param rightSlug - Right model slug or empty string.
 * @returns Compare path with optional query params.
 */
export function buildCompareHref(
  pathname: string,
  leftSlug: string,
  rightSlug: string,
) {
  const params = new URLSearchParams();
  if (leftSlug) params.set("a", leftSlug);
  if (rightSlug) params.set("b", rightSlug);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * CompareModelsShell
 *
 * Renders model selectors and the side-by-side comparison when both are chosen.
 *
 * @param props.models - Active catalog models with published specs.
 * @param props.initialLeftSlug - Optional left slug from the URL.
 * @param props.initialRightSlug - Optional right slug from the URL.
 * @param props.className - Optional wrapper classes.
 * @returns Compare pickers and comparison table.
 * @calledBy ComparePage
 */
export function CompareModelsShell({
  models,
  initialLeftSlug = "",
  initialRightSlug = "",
  className,
}: CompareModelsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const leftSlug = searchParams.get("a") ?? initialLeftSlug;
  const rightSlug = searchParams.get("b") ?? initialRightSlug;

  const leftModel = useMemo(
    () => models.find((model) => model.slug === leftSlug) ?? null,
    [leftSlug, models],
  );
  const rightModel = useMemo(
    () => models.find((model) => model.slug === rightSlug) ?? null,
    [models, rightSlug],
  );

  const updateSelection = useCallback(
    (side: "a" | "b", slug: string) => {
      const nextLeft = side === "a" ? slug : leftSlug;
      const nextRight = side === "b" ? slug : rightSlug;
      const href = buildCompareHref(pathname, nextLeft, nextRight);

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [leftSlug, pathname, rightSlug, router],
  );

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="compare-model-left">Primer modelo</Label>
          <Select
            id="compare-model-left"
            value={leftSlug}
            onChange={(event) => updateSelection("a", event.target.value)}
          >
            <option value="">Elige un modelo</option>
            {models.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="compare-model-right">Segundo modelo</Label>
          <Select
            id="compare-model-right"
            value={rightSlug}
            onChange={(event) => updateSelection("b", event.target.value)}
          >
            <option value="">Elige un modelo</option>
            {models.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {leftModel && rightModel ? (
        <ModelCompareView left={leftModel.entry} right={rightModel.entry} />
      ) : (
        <EmptyState
          title="Elige dos modelos para comparar"
          description="Selecciona un iPhone en cada columna para ver pantalla, batería, chip, cámaras y más, lado a lado."
        />
      )}
    </div>
  );
}
