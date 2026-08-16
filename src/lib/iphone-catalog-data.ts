/**
 * @file iphone-catalog-data.ts
 * @description Canonical TruePhone iPhone catalog: 28 commercially released models from 2020 onward.
 * @dependencies none
 */

export const IPHONE_PRODUCT_LINES = [
  "IPHONE",
  "IPHONE_SE",
  "IPHONE_AIR",
] as const;
export type IphoneProductLineId = (typeof IPHONE_PRODUCT_LINES)[number];

export const IPHONE_VARIANT_TYPES = [
  "STANDARD",
  "MINI",
  "PLUS",
  "PRO",
  "PRO_MAX",
  "E",
  "AIR",
] as const;
export type IphoneVariantTypeId = (typeof IPHONE_VARIANT_TYPES)[number];

export type CatalogColorSeed = {
  name: string;
  hex: string;
};

export type CatalogModelSeed = {
  name: string;
  slug: string;
  productLine: IphoneProductLineId;
  generation: number;
  variantType: IphoneVariantTypeId;
  releaseYear: number;
  /** Chronological catalog position, 1 = oldest in scope. */
  sortOrder: number;
  storageGb: number[];
  colorNames: string[];
};

/**
 * Official-ish Spanish color names for the Colombia marketplace, with hex for chips.
 */
export const IPHONE_CATALOG_COLORS: CatalogColorSeed[] = [
  { name: "Negro", hex: "#1C1C1E" },
  { name: "Blanco", hex: "#F5F5F7" },
  { name: "(PRODUCT)RED", hex: "#E11D2E" },
  { name: "Verde", hex: "#248A3D" },
  { name: "Azul", hex: "#3B82F6" },
  { name: "Morado", hex: "#A855F7" },
  { name: "Rosa", hex: "#FB7185" },
  { name: "Grafito", hex: "#52525B" },
  { name: "Dorado", hex: "#D4AF77" },
  { name: "Plata", hex: "#E8E8E8" },
  { name: "Azul Pacífico", hex: "#2C4A6E" },
  { name: "Medianoche", hex: "#191D26" },
  { name: "Luz de estrellas", hex: "#F4F1EA" },
  { name: "Azul Sierra", hex: "#9BB5CE" },
  { name: "Verde alpino", hex: "#576856" },
  { name: "Negro espacial", hex: "#2C2C2E" },
  { name: "Púrpura intenso", hex: "#5E5B81" },
  { name: "Amarillo", hex: "#F5D76E" },
  { name: "Titanio natural", hex: "#A8A29E" },
  { name: "Titanio negro", hex: "#44403C" },
  { name: "Titanio blanco", hex: "#E7E5E4" },
  { name: "Titanio azul", hex: "#4A5568" },
  { name: "Titanio del desierto", hex: "#C4A574" },
  { name: "Verde azulado", hex: "#4A8B8B" },
  { name: "Ultramar", hex: "#3D4E9A" },
  { name: "Naranja cósmico", hex: "#E07A3D" },
  { name: "Azul profundo", hex: "#1E3A5F" },
  { name: "Rosa suave", hex: "#E8C4C8" },
  { name: "Blanco nube", hex: "#F2F2F0" },
  { name: "Oro claro", hex: "#E8D5B5" },
  { name: "Azul cielo", hex: "#8BB8D8" },
  { name: "Azul niebla", hex: "#A8B8C8" },
  { name: "Salvia", hex: "#9BA88C" },
  { name: "Lavanda", hex: "#C5B8D4" },
];

export const IPHONE_CATALOG_STORAGES_GB = [
  64, 128, 256, 512, 1024, 2048,
] as const;

const GB_64_256 = [64, 128, 256];
const GB_128_512 = [128, 256, 512];
const GB_128_1TB = [128, 256, 512, 1024];
const GB_256_512 = [256, 512];
const GB_256_1TB = [256, 512, 1024];
const GB_256_2TB = [256, 512, 1024, 2048];

const C12 = ["Negro", "Blanco", "(PRODUCT)RED", "Verde", "Azul", "Morado"];
const C12_PRO = ["Plata", "Grafito", "Dorado", "Azul Pacífico"];
const C13 = [
  "(PRODUCT)RED",
  "Luz de estrellas",
  "Medianoche",
  "Azul",
  "Rosa",
  "Verde",
];
const C13_PRO = ["Grafito", "Dorado", "Plata", "Azul Sierra", "Verde alpino"];
const C14 = [
  "Medianoche",
  "Luz de estrellas",
  "(PRODUCT)RED",
  "Azul",
  "Morado",
  "Amarillo",
];
const C14_PRO = ["Plata", "Dorado", "Negro espacial", "Púrpura intenso"];
const C15 = ["Negro", "Azul", "Verde", "Amarillo", "Rosa"];
const C15_PRO = [
  "Titanio negro",
  "Titanio blanco",
  "Titanio azul",
  "Titanio natural",
];
const C16 = ["Negro", "Blanco", "Rosa", "Verde azulado", "Ultramar"];
const C16_PRO = [
  "Titanio negro",
  "Titanio blanco",
  "Titanio natural",
  "Titanio del desierto",
];
const C17 = ["Negro", "Blanco", "Azul niebla", "Salvia", "Lavanda"];
const C17_PRO = ["Plata", "Naranja cósmico", "Azul profundo"];
const C_AIR = ["Negro espacial", "Blanco nube", "Oro claro", "Azul cielo"];

/**
 * Required 28-model catalog from iPhone 12 / SE (2nd gen) through iPhone 17e.
 * Product line is explicit: SE and Air are not numbered-generation variants.
 */
export const IPHONE_CATALOG_MODELS: CatalogModelSeed[] = [
  {
    name: "iPhone SE (2.ª generación)",
    slug: "iphone-se-2",
    productLine: "IPHONE_SE",
    generation: 2,
    variantType: "STANDARD",
    releaseYear: 2020,
    sortOrder: 1,
    storageGb: GB_64_256,
    colorNames: ["Blanco", "Negro", "(PRODUCT)RED"],
  },
  {
    name: "iPhone 12 mini",
    slug: "iphone-12-mini",
    productLine: "IPHONE",
    generation: 12,
    variantType: "MINI",
    releaseYear: 2020,
    sortOrder: 2,
    storageGb: GB_64_256,
    colorNames: C12,
  },
  {
    name: "iPhone 12",
    slug: "iphone-12",
    productLine: "IPHONE",
    generation: 12,
    variantType: "STANDARD",
    releaseYear: 2020,
    sortOrder: 3,
    storageGb: GB_64_256,
    colorNames: C12,
  },
  {
    name: "iPhone 12 Pro",
    slug: "iphone-12-pro",
    productLine: "IPHONE",
    generation: 12,
    variantType: "PRO",
    releaseYear: 2020,
    sortOrder: 4,
    storageGb: GB_128_512,
    colorNames: C12_PRO,
  },
  {
    name: "iPhone 12 Pro Max",
    slug: "iphone-12-pro-max",
    productLine: "IPHONE",
    generation: 12,
    variantType: "PRO_MAX",
    releaseYear: 2020,
    sortOrder: 5,
    storageGb: GB_128_512,
    colorNames: C12_PRO,
  },
  {
    name: "iPhone 13 mini",
    slug: "iphone-13-mini",
    productLine: "IPHONE",
    generation: 13,
    variantType: "MINI",
    releaseYear: 2021,
    sortOrder: 6,
    storageGb: GB_128_512,
    colorNames: C13,
  },
  {
    name: "iPhone 13",
    slug: "iphone-13",
    productLine: "IPHONE",
    generation: 13,
    variantType: "STANDARD",
    releaseYear: 2021,
    sortOrder: 7,
    storageGb: GB_128_512,
    colorNames: C13,
  },
  {
    name: "iPhone 13 Pro",
    slug: "iphone-13-pro",
    productLine: "IPHONE",
    generation: 13,
    variantType: "PRO",
    releaseYear: 2021,
    sortOrder: 8,
    storageGb: GB_128_1TB,
    colorNames: C13_PRO,
  },
  {
    name: "iPhone 13 Pro Max",
    slug: "iphone-13-pro-max",
    productLine: "IPHONE",
    generation: 13,
    variantType: "PRO_MAX",
    releaseYear: 2021,
    sortOrder: 9,
    storageGb: GB_128_1TB,
    colorNames: C13_PRO,
  },
  {
    name: "iPhone SE (3.ª generación)",
    slug: "iphone-se-3",
    productLine: "IPHONE_SE",
    generation: 3,
    variantType: "STANDARD",
    releaseYear: 2022,
    sortOrder: 10,
    storageGb: GB_64_256,
    colorNames: ["(PRODUCT)RED", "Luz de estrellas", "Medianoche"],
  },
  {
    name: "iPhone 14",
    slug: "iphone-14",
    productLine: "IPHONE",
    generation: 14,
    variantType: "STANDARD",
    releaseYear: 2022,
    sortOrder: 11,
    storageGb: GB_128_512,
    colorNames: C14,
  },
  {
    name: "iPhone 14 Plus",
    slug: "iphone-14-plus",
    productLine: "IPHONE",
    generation: 14,
    variantType: "PLUS",
    releaseYear: 2022,
    sortOrder: 12,
    storageGb: GB_128_512,
    colorNames: C14,
  },
  {
    name: "iPhone 14 Pro",
    slug: "iphone-14-pro",
    productLine: "IPHONE",
    generation: 14,
    variantType: "PRO",
    releaseYear: 2022,
    sortOrder: 13,
    storageGb: GB_128_1TB,
    colorNames: C14_PRO,
  },
  {
    name: "iPhone 14 Pro Max",
    slug: "iphone-14-pro-max",
    productLine: "IPHONE",
    generation: 14,
    variantType: "PRO_MAX",
    releaseYear: 2022,
    sortOrder: 14,
    storageGb: GB_128_1TB,
    colorNames: C14_PRO,
  },
  {
    name: "iPhone 15",
    slug: "iphone-15",
    productLine: "IPHONE",
    generation: 15,
    variantType: "STANDARD",
    releaseYear: 2023,
    sortOrder: 15,
    storageGb: GB_128_512,
    colorNames: C15,
  },
  {
    name: "iPhone 15 Plus",
    slug: "iphone-15-plus",
    productLine: "IPHONE",
    generation: 15,
    variantType: "PLUS",
    releaseYear: 2023,
    sortOrder: 16,
    storageGb: GB_128_512,
    colorNames: C15,
  },
  {
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    productLine: "IPHONE",
    generation: 15,
    variantType: "PRO",
    releaseYear: 2023,
    sortOrder: 17,
    storageGb: GB_128_1TB,
    colorNames: C15_PRO,
  },
  {
    name: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    productLine: "IPHONE",
    generation: 15,
    variantType: "PRO_MAX",
    releaseYear: 2023,
    sortOrder: 18,
    storageGb: GB_256_1TB,
    colorNames: C15_PRO,
  },
  {
    name: "iPhone 16",
    slug: "iphone-16",
    productLine: "IPHONE",
    generation: 16,
    variantType: "STANDARD",
    releaseYear: 2024,
    sortOrder: 19,
    storageGb: GB_128_512,
    colorNames: C16,
  },
  {
    name: "iPhone 16 Plus",
    slug: "iphone-16-plus",
    productLine: "IPHONE",
    generation: 16,
    variantType: "PLUS",
    releaseYear: 2024,
    sortOrder: 20,
    storageGb: GB_128_512,
    colorNames: C16,
  },
  {
    name: "iPhone 16 Pro",
    slug: "iphone-16-pro",
    productLine: "IPHONE",
    generation: 16,
    variantType: "PRO",
    releaseYear: 2024,
    sortOrder: 21,
    storageGb: GB_128_1TB,
    colorNames: C16_PRO,
  },
  {
    name: "iPhone 16 Pro Max",
    slug: "iphone-16-pro-max",
    productLine: "IPHONE",
    generation: 16,
    variantType: "PRO_MAX",
    releaseYear: 2024,
    sortOrder: 22,
    storageGb: GB_256_1TB,
    colorNames: C16_PRO,
  },
  {
    name: "iPhone 16e",
    slug: "iphone-16e",
    productLine: "IPHONE",
    generation: 16,
    variantType: "E",
    releaseYear: 2025,
    sortOrder: 23,
    storageGb: GB_128_512,
    colorNames: ["Negro", "Blanco"],
  },
  {
    name: "iPhone 17",
    slug: "iphone-17",
    productLine: "IPHONE",
    generation: 17,
    variantType: "STANDARD",
    releaseYear: 2025,
    sortOrder: 24,
    storageGb: GB_256_512,
    colorNames: C17,
  },
  {
    name: "iPhone Air",
    slug: "iphone-air",
    productLine: "IPHONE_AIR",
    generation: 1,
    variantType: "AIR",
    releaseYear: 2025,
    sortOrder: 25,
    storageGb: GB_256_1TB,
    colorNames: C_AIR,
  },
  {
    name: "iPhone 17 Pro",
    slug: "iphone-17-pro",
    productLine: "IPHONE",
    generation: 17,
    variantType: "PRO",
    releaseYear: 2025,
    sortOrder: 26,
    storageGb: GB_256_1TB,
    colorNames: C17_PRO,
  },
  {
    name: "iPhone 17 Pro Max",
    slug: "iphone-17-pro-max",
    productLine: "IPHONE",
    generation: 17,
    variantType: "PRO_MAX",
    releaseYear: 2025,
    sortOrder: 27,
    storageGb: GB_256_2TB,
    colorNames: C17_PRO,
  },
  {
    name: "iPhone 17e",
    slug: "iphone-17e",
    productLine: "IPHONE",
    generation: 17,
    variantType: "E",
    releaseYear: 2026,
    sortOrder: 28,
    storageGb: GB_256_512,
    colorNames: ["Negro", "Blanco", "Rosa suave"],
  },
];
