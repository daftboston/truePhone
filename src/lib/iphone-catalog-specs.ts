/**
 * @file iphone-catalog-specs.ts
 * @description Published hardware specifications keyed by catalog model slug for browse UI.
 * @dependencies iphone-catalog-data
 */

import { IPHONE_CATALOG_MODELS } from "@/lib/iphone-catalog-data";

export type CatalogModelSpecs = {
  displaySizeInches: number;
  resolution: string;
  ramGb?: number;
  chip: string;
  cameras: string;
  batteryMah?: number;
  uniqueFeatures: string[];
};

const SPECS_BY_SLUG: Record<string, CatalogModelSpecs> = {
  "iphone-12-mini": {
    displaySizeInches: 5.4,
    resolution: "2340 × 1080 píxeles (476 ppp)",
    ramGb: 4,
    chip: "Apple A14 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 2227,
    uniqueFeatures: [
      "Formato mini de la generación 12",
      "Ceramic Shield y MagSafe",
      "5G",
    ],
  },
  "iphone-12": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 4,
    chip: "Apple A14 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 2815,
    uniqueFeatures: [
      "Pantalla Super Retina XDR de 6,1″",
      "Ceramic Shield y MagSafe",
      "5G",
    ],
  },
  "iphone-12-pro": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A14 Bionic",
    cameras: "Triple 12 MP + escáner LiDAR",
    batteryMah: 2815,
    uniqueFeatures: [
      "Acero inoxidable",
      "Modo Noche en todas las cámaras",
      "ProRAW y Apple ProRes",
    ],
  },
  "iphone-12-pro-max": {
    displaySizeInches: 6.7,
    resolution: "2778 × 1284 píxeles (458 ppp)",
    ramGb: 6,
    chip: "Apple A14 Bionic",
    cameras: "Triple 12 MP + escáner LiDAR",
    batteryMah: 3687,
    uniqueFeatures: [
      "Mayor autonomía de la serie 12",
      "Sensor principal con estabilización",
      "ProRAW y Apple ProRes",
    ],
  },
  "iphone-13-mini": {
    displaySizeInches: 5.4,
    resolution: "2340 × 1080 píxeles (476 ppp)",
    ramGb: 4,
    chip: "Apple A15 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 2406,
    uniqueFeatures: [
      "Último iPhone mini",
      "Modo Cine y Fotográficos",
      "Ceramic Shield y MagSafe",
    ],
  },
  "iphone-13": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 4,
    chip: "Apple A15 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 3227,
    uniqueFeatures: [
      "Modo Cine y Fotográficos",
      "Ceramic Shield y MagSafe",
      "5G",
    ],
  },
  "iphone-13-pro": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A15 Bionic",
    cameras: "Triple 12 MP + escáner LiDAR",
    batteryMah: 3095,
    uniqueFeatures: [
      "ProMotion hasta 120 Hz",
      "Always-On display",
      "Macro photography",
    ],
  },
  "iphone-13-pro-max": {
    displaySizeInches: 6.7,
    resolution: "2778 × 1284 píxeles (458 ppp)",
    ramGb: 6,
    chip: "Apple A15 Bionic",
    cameras: "Triple 12 MP + escáner LiDAR",
    batteryMah: 4352,
    uniqueFeatures: [
      "ProMotion hasta 120 Hz",
      "Always-On display",
      "Mayor autonomía de la serie 13",
    ],
  },
  "iphone-se-3": {
    displaySizeInches: 4.7,
    resolution: "1334 × 750 píxeles (326 ppp)",
    ramGb: 4,
    chip: "Apple A15 Bionic",
    cameras: "12 MP gran angular",
    batteryMah: 2018,
    uniqueFeatures: [
      "Touch ID en botón Inicio",
      "Diseño compacto clásico",
      "5G",
    ],
  },
  "iphone-se-4": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18",
    cameras: "48 MP Fusion",
    batteryMah: 4005,
    uniqueFeatures: [
      "Cuarta generación de la línea SE",
      "Face ID y pantalla OLED a pantalla completa",
      "Botón de Acción y USB-C",
    ],
  },
  "iphone-14": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A15 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 3279,
    uniqueFeatures: [
      "Detección de choque y SOS de emergencia",
      "Modo Acción en vídeo",
      "MagSafe",
    ],
  },
  "iphone-14-plus": {
    displaySizeInches: 6.7,
    resolution: "2778 × 1284 píxeles (458 ppp)",
    ramGb: 6,
    chip: "Apple A15 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 4325,
    uniqueFeatures: [
      "Pantalla grande de 6,7″",
      "Detección de choque y SOS de emergencia",
      "MagSafe",
    ],
  },
  "iphone-14-pro": {
    displaySizeInches: 6.1,
    resolution: "2556 × 1179 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A16 Bionic",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 3200,
    uniqueFeatures: [
      "Dynamic Island",
      "Always-On display",
      "ProMotion hasta 120 Hz",
    ],
  },
  "iphone-14-pro-max": {
    displaySizeInches: 6.7,
    resolution: "2796 × 1290 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A16 Bionic",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 4323,
    uniqueFeatures: [
      "Dynamic Island",
      "Always-On display",
      "Mayor autonomía de la serie 14 Pro",
    ],
  },
  "iphone-15": {
    displaySizeInches: 6.1,
    resolution: "2556 × 1179 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A16 Bionic",
    cameras: "Dual 48 MP (gran angular + ultra gran angular)",
    batteryMah: 3349,
    uniqueFeatures: ["Dynamic Island", "USB-C", "Retratos de nueva generación"],
  },
  "iphone-15-plus": {
    displaySizeInches: 6.7,
    resolution: "2796 × 1290 píxeles (460 ppp)",
    ramGb: 6,
    chip: "Apple A16 Bionic",
    cameras: "Dual 48 MP (gran angular + ultra gran angular)",
    batteryMah: 4383,
    uniqueFeatures: ["Pantalla grande de 6,7″", "Dynamic Island", "USB-C"],
  },
  "iphone-15-pro": {
    displaySizeInches: 6.1,
    resolution: "2556 × 1179 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A17 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 3274,
    uniqueFeatures: ["Titanio", "Botón de Acción", "USB-C con Thunderbolt"],
  },
  "iphone-15-pro-max": {
    displaySizeInches: 6.7,
    resolution: "2796 × 1290 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A17 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 4441,
    uniqueFeatures: ["Titanio", "Zoom óptico 5×", "USB-C con Thunderbolt"],
  },
  "iphone-16": {
    displaySizeInches: 6.1,
    resolution: "2556 × 1179 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18",
    cameras: "Dual 48 MP Fusion (gran angular + ultra gran angular)",
    batteryMah: 3561,
    uniqueFeatures: [
      "Control de Cámara",
      "Botón de Acción",
      "Apple Intelligence",
    ],
  },
  "iphone-16-plus": {
    displaySizeInches: 6.7,
    resolution: "2796 × 1290 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18",
    cameras: "Dual 48 MP Fusion (gran angular + ultra gran angular)",
    batteryMah: 4674,
    uniqueFeatures: [
      "Pantalla grande de 6,7″",
      "Control de Cámara",
      "Apple Intelligence",
    ],
  },
  "iphone-16-pro": {
    displaySizeInches: 6.3,
    resolution: "2622 × 1206 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 3582,
    uniqueFeatures: [
      "Pantalla Pro de 6,3″",
      "Control de Cámara",
      "ProMotion hasta 120 Hz",
    ],
  },
  "iphone-16-pro-max": {
    displaySizeInches: 6.9,
    resolution: "2868 × 1320 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 4685,
    uniqueFeatures: [
      "Pantalla Pro Max de 6,9″",
      "Control de Cámara",
      "Mayor autonomía de la serie 16 Pro",
    ],
  },
  "iphone-16e": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18",
    cameras: "48 MP Fusion",
    batteryMah: 4005,
    uniqueFeatures: [
      "Opción asequible con pantalla OLED",
      "Face ID y Botón de Acción",
      "USB-C",
    ],
  },
  "iphone-17": {
    displaySizeInches: 6.3,
    resolution: "2622 × 1206 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A19",
    cameras: "Dual 48 MP Fusion (gran angular + ultra gran angular)",
    batteryMah: 3692,
    uniqueFeatures: [
      "Always-On display",
      "Ceramic Shield 2",
      "Control de Cámara",
    ],
  },
  "iphone-air": {
    displaySizeInches: 6.5,
    resolution: "2736 × 1260 píxeles (460 ppp)",
    ramGb: 12,
    chip: "Apple A19 Pro",
    cameras: "48 MP Fusion",
    batteryMah: 3149,
    uniqueFeatures: [
      "Diseño ultradelgado de 5,6 mm",
      "ProMotion hasta 120 Hz",
      "Línea iPhone Air independiente",
    ],
  },
  "iphone-17-pro": {
    displaySizeInches: 6.3,
    resolution: "2622 × 1206 píxeles (460 ppp)",
    ramGb: 12,
    chip: "Apple A19 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 4252,
    uniqueFeatures: [
      "Chasis unibody de aluminio",
      "ProMotion hasta 120 Hz",
      "Zoom óptico avanzado",
    ],
  },
  "iphone-17-pro-max": {
    displaySizeInches: 6.9,
    resolution: "2868 × 1320 píxeles (460 ppp)",
    ramGb: 12,
    chip: "Apple A19 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 5088,
    uniqueFeatures: [
      "Mayor autonomía de la serie 17 Pro",
      "Pantalla Pro Max de 6,9″",
      "ProMotion hasta 120 Hz",
    ],
  },
  "iphone-17e": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A19",
    cameras: "48 MP Fusion",
    batteryMah: 4005,
    uniqueFeatures: [
      "MagSafe de 15 W",
      "Ceramic Shield 2",
      "Opción asequible con chip A19",
    ],
  },
};

/**
 * getCatalogModelSpecs
 *
 * Returns published hardware specs for an active catalog slug.
 *
 * @param slug - IphoneModel slug from the canonical catalog.
 * @returns Specs row or null when the slug is unknown.
 * @calledBy ModelSpecsCard, SearchPage
 */
export function getCatalogModelSpecs(slug: string): CatalogModelSpecs | null {
  return SPECS_BY_SLUG[slug] ?? null;
}

/**
 * getRequiredCatalogModelSpecs
 *
 * Returns specs for a slug that must exist in the active 28-model catalog.
 *
 * @param slug - IphoneModel slug from the canonical catalog.
 * @returns Specs row.
 * @throws When the slug has no specs entry.
 * @calledBy catalog spec tests
 */
export function getRequiredCatalogModelSpecs(slug: string): CatalogModelSpecs {
  const specs = getCatalogModelSpecs(slug);
  if (!specs) {
    throw new Error(`Missing catalog specs for slug: ${slug}`);
  }
  return specs;
}

/** Active catalog slugs that must have a specs entry. */
export const CATALOG_SPECS_SLUGS = IPHONE_CATALOG_MODELS.map(
  (model) => model.slug,
);
