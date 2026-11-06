import { MAX_COP } from "./policy";
export type PriceCatalogEntry = {
  iphoneModelId: string;
  iphoneStorageId: string;
  modelName: string;
  valueGb: number;
};
export type ImportIssue = {
  row: number;
  code: "INVALID_ROW" | "UNKNOWN_COMBINATION" | "DUPLICATE" | "INVALID_PRICE";
};
const normalize = (s: string) =>
  s.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
export function parsePriceRows(
  values: unknown[][],
  catalog: PriceCatalogEntry[],
) {
  if (values.length < 2 || values.length >= 500)
    throw new Error("EMPTY_OR_TRUNCATED_SHEET");
  const headers = values[0].map((v) =>
    typeof v === "string" ? normalize(v) : "",
  );
  const modelIndex = headers.indexOf("modelo"),
    storageIndex = headers.indexOf("capacidad"),
    priceIndex = headers.indexOf("precio de compra (cop)");
  if (
    [modelIndex, storageIndex, priceIndex].some((i) => i < 0) ||
    ["modelo", "capacidad", "precio de compra (cop)"].some(
      (h) => headers.filter((value) => value === h).length !== 1,
    )
  )
    throw new Error("INVALID_HEADERS");
  const rows = new Map<
    string,
    {
      iphoneModelId: string;
      iphoneStorageId: string;
      purchasePriceCop: number;
      sourceRow: number;
    }
  >();
  const preserve = new Set<string>();
  const seen = new Set<string>();
  const issues: ImportIssue[] = [];
  const allKeys = new Set(
    catalog.map((c) => `${c.iphoneModelId}:${c.iphoneStorageId}`),
  );
  values.slice(1).forEach((row, index) => {
    const sourceRow = index + 2;
    if (row.every((v) => v === "" || v === null || v === undefined)) return;
    const model = row[modelIndex],
      capacity = row[storageIndex],
      price = row[priceIndex];
    const capacityText =
      typeof capacity === "number"
        ? `${capacity} gb`
        : typeof capacity === "string"
          ? normalize(capacity)
          : "";
    const match = capacityText.match(/^(\d+)\s*(gb|tb)?$/);
    const gb = match ? Number(match[1]) * (match[2] === "tb" ? 1024 : 1) : null;
    if (typeof model !== "string" || gb === null) {
      // If a malformed row cannot identify a combination, do not retire old prices
      // for that model (or any model when even its name cannot be resolved).
      const known =
        typeof model === "string"
          ? catalog.filter((c) => normalize(c.modelName) === normalize(model))
          : [];
      for (const c of known.length ? known : catalog)
        preserve.add(`${c.iphoneModelId}:${c.iphoneStorageId}`);
      issues.push({ row: sourceRow, code: "INVALID_ROW" });
      return;
    }
    const entry = catalog.find(
      (c) => normalize(c.modelName) === normalize(model) && c.valueGb === gb,
    );
    if (!entry) {
      issues.push({ row: sourceRow, code: "UNKNOWN_COMBINATION" });
      return;
    }
    const key = `${entry.iphoneModelId}:${entry.iphoneStorageId}`;
    if (seen.has(key)) {
      rows.delete(key);
      preserve.add(key);
      issues.push({ row: sourceRow, code: "DUPLICATE" });
      return;
    }
    seen.add(key);
    if (
      typeof price !== "number" ||
      !Number.isSafeInteger(price) ||
      price <= 100_000 ||
      price > MAX_COP
    ) {
      preserve.add(key);
      issues.push({ row: sourceRow, code: "INVALID_PRICE" });
      return;
    }
    rows.set(key, {
      iphoneModelId: entry.iphoneModelId,
      iphoneStorageId: entry.iphoneStorageId,
      purchasePriceCop: price,
      sourceRow,
    });
  });
  if (!rows.size) throw new Error("NO_VALID_PRICES");
  return {
    rows: [...rows.values()],
    issues,
    deactivate: [...allKeys].filter(
      (key) => !rows.has(key) && !preserve.has(key),
    ),
  };
}
