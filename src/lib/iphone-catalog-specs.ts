/**
 * @file iphone-catalog-specs.ts
 * @description Published hardware specifications keyed by catalog model slug for browse UI.
 * @dependencies iphone-catalog-data
 * @changelog 2026-09-15 — Canonical unique-feature names; battery mAh caption; sibling highlights aligned.
 */

import { IPHONE_CATALOG_MODELS } from "@/lib/iphone-catalog-data";

export type CameraModuleVariant = "single" | "dual" | "triple";

type CatalogModelSpecsSeed = {
  displaySizeInches: number;
  resolution: string;
  ramGb?: number;
  chip: string;
  cameras: string;
  batteryMah?: number;
  uniqueFeatures: string[];
};

export type CatalogModelSpecs = CatalogModelSpecsSeed & {
  displayMarketingName: string;
  chipBadge: string;
  chipHeadline: string;
  chipDetail?: string;
  cameraHeadline: string;
  cameraDetails: string[];
  cameraModuleVariant: CameraModuleVariant;
  frontCameraHeadline?: string;
  frontCameraDetails?: string[];
  batteryPrimaryLabel: string;
  batterySecondaryLabel?: string;
};

const DISPLAY_MARKETING: Record<string, string> = {
  "iphone-se-3": "Pantalla Retina HD",
};

const PRO_MOTION_SLUGS = new Set([
  "iphone-13-pro",
  "iphone-13-pro-max",
  "iphone-14-pro",
  "iphone-14-pro-max",
  "iphone-15-pro",
  "iphone-15-pro-max",
  "iphone-16-pro",
  "iphone-16-pro-max",
  "iphone-17",
  "iphone-air",
  "iphone-17-pro",
  "iphone-17-pro-max",
]);

const CENTER_STAGE_FRONT_SLUGS = new Set([
  "iphone-17",
  "iphone-air",
  "iphone-17-pro",
  "iphone-17-pro-max",
  "iphone-17e",
]);

/**
 * formatCatalogDisplaySize
 *
 * Formats a diagonal display size for Spanish UI copy.
 *
 * @param inches - Display diagonal in inches.
 * @returns Localized size label such as `5,4″`.
 */
export function formatCatalogDisplaySize(inches: number): string {
  return `${inches.toLocaleString("es-CO", {
    minimumFractionDigits: inches % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}″`;
}

/**
 * extractChipBadge
 *
 * Builds the short uppercase chip badge label from a full chip name.
 *
 * @param chip - Full Apple chip name.
 * @returns Badge label such as `A19 PRO`.
 */
function extractChipBadge(chip: string): string {
  const match = chip.match(/Apple (A\d+(?: Pro)?)/);
  return match
    ? match[1]!.toUpperCase()
    : chip.replace(/^Apple /, "").toUpperCase();
}

/**
 * buildChipHeadline
 *
 * Converts a catalog chip string into Apple-style headline copy.
 *
 * @param chip - Full Apple chip name.
 * @returns Headline such as `Chip A14 Bionic`.
 */
function buildChipHeadline(chip: string): string {
  return chip.replace(/^Apple /, "Chip ");
}

/**
 * buildChipDetail
 *
 * Returns a published GPU summary when Apple documents core counts.
 *
 * @param slug - Catalog model slug.
 * @param chip - Full Apple chip name.
 * @returns GPU detail line or undefined.
 */
function buildChipDetail(slug: string, chip: string): string | undefined {
  if (chip.includes("A19 Pro")) {
    return "GPU de 6 núcleos con Neural Accelerators";
  }
  if (chip.includes("A19")) {
    return "GPU de 4 núcleos con Neural Accelerators";
  }
  if (chip.includes("A18 Pro")) {
    return "GPU de 6 núcleos";
  }
  if (chip.includes("A18")) {
    return "GPU de 5 núcleos";
  }
  if (chip.includes("A17 Pro")) {
    return "GPU de 6 núcleos";
  }
  if (chip.includes("A16")) {
    return "GPU de 5 núcleos";
  }
  if (chip.includes("A15") && slug.includes("pro")) {
    return "GPU de 5 núcleos";
  }
  if (chip.includes("A15")) {
    return "GPU de 4 núcleos";
  }
  if (chip.includes("A14")) {
    return "GPU de 4 núcleos";
  }
  return undefined;
}

/**
 * buildDisplayMarketingName
 *
 * Chooses the Apple marketing display name for a model slug.
 *
 * @param slug - Catalog model slug.
 * @returns Display marketing label.
 */
function buildDisplayMarketingName(slug: string): string {
  if (DISPLAY_MARKETING[slug]) {
    return DISPLAY_MARKETING[slug]!;
  }
  if (PRO_MOTION_SLUGS.has(slug)) {
    return "Pantalla Super Retina XDR con ProMotion";
  }
  return "Pantalla Super Retina XDR";
}

/**
 * buildCameraPresentation
 *
 * Builds Apple-style rear camera headline, detail lines, and bump icon variant.
 *
 * @param slug - Catalog model slug.
 * @param cameras - Legacy summary string kept for tests.
 * @returns Camera presentation fields.
 */
function buildCameraPresentation(
  slug: string,
  cameras: string,
): Pick<
  CatalogModelSpecs,
  "cameraHeadline" | "cameraDetails" | "cameraModuleVariant"
> {
  if (slug === "iphone-se-3") {
    return {
      cameraHeadline: "Cámara gran angular de 12 MP",
      cameraDetails: ["Apertura ƒ/1.8 con estabilización automática"],
      cameraModuleVariant: "single",
    };
  }

  if (
    slug === "iphone-se-4" ||
    slug === "iphone-16e" ||
    slug === "iphone-17e" ||
    slug === "iphone-air"
  ) {
    return {
      cameraHeadline: "Cámara Fusion de 48 MP",
      cameraDetails: [
        "Sensor principal de 48 MP",
        "Estabilización óptica de imagen por sensor-shift",
      ],
      cameraModuleVariant: "single",
    };
  }

  if (slug.includes("17-pro")) {
    return {
      cameraHeadline: "Sistema de cámaras Pro Fusion de 48 MP",
      cameraDetails: [
        "Fusion principal de 48 MP (ƒ/1.78)",
        "Fusion ultra gran angular de 48 MP",
        "Fusion teleobjetivo de 48 MP (4×) + escáner LiDAR",
      ],
      cameraModuleVariant: "triple",
    };
  }

  if (
    slug.includes("16-pro") ||
    slug.includes("15-pro") ||
    slug.includes("14-pro") ||
    slug.includes("13-pro") ||
    slug.includes("12-pro")
  ) {
    const generation = slug.includes("12")
      ? "12 MP"
      : slug.includes("13")
        ? "12 MP"
        : "48 MP";
    return {
      cameraHeadline: `Sistema de cámaras Pro${generation === "48 MP" ? " Fusion" : ""} de ${generation}`,
      cameraDetails:
        generation === "48 MP"
          ? [
              "Fusion principal de 48 MP",
              "Fusion ultra gran angular de 48 MP",
              "Fusion teleobjetivo + escáner LiDAR",
            ]
          : [
              "Teleobjetivo, gran angular y ultra gran angular de 12 MP",
              "Escáner LiDAR",
            ],
      cameraModuleVariant: "triple",
    };
  }

  if (slug === "iphone-17" || slug.includes("16") || slug.includes("15")) {
    const usesFusion = slug.includes("16") || slug === "iphone-17";
    return {
      cameraHeadline:
        slug === "iphone-17"
          ? "Sistema Fusion dual de 48 MP"
          : usesFusion
            ? "Sistema Fusion de cámaras de 48 MP"
            : "Sistema de cámaras de 48 MP",
      cameraDetails: [
        usesFusion ? "Fusion principal de 48 MP" : "Gran angular de 48 MP",
        usesFusion
          ? "Fusion ultra gran angular de 48 MP"
          : "Ultra gran angular de 48 MP",
      ],
      cameraModuleVariant: "dual",
    };
  }

  if (cameras.includes("Dual")) {
    return {
      cameraHeadline: "Sistema de cámaras dual de 12 MP",
      cameraDetails: ["Gran angular de 12 MP", "Ultra gran angular de 12 MP"],
      cameraModuleVariant: "dual",
    };
  }

  return {
    cameraHeadline: cameras,
    cameraDetails: [],
    cameraModuleVariant: "single",
  };
}

/**
 * buildFrontCameraPresentation
 *
 * Builds optional front-camera headline and detail lines.
 *
 * @param slug - Catalog model slug.
 * @returns Front camera presentation fields.
 */
function buildFrontCameraPresentation(slug: string): {
  frontCameraHeadline?: string;
  frontCameraDetails?: string[];
} {
  if (CENTER_STAGE_FRONT_SLUGS.has(slug)) {
    return {
      frontCameraHeadline: "Cámara frontal Center Stage de 18 MP",
      frontCameraDetails: ["Vídeo ultraestabilizado", "Captura Dual"],
    };
  }

  if (slug === "iphone-se-3") {
    return {
      frontCameraHeadline: "Cámara FaceTime HD de 7 MP",
      frontCameraDetails: ["Compatible con Retina Flash"],
    };
  }

  return {
    frontCameraHeadline: "Cámara TrueDepth de 12 MP",
    frontCameraDetails: ["Modo Retrato y Face ID"],
  };
}

/**
 * buildBatteryPresentation
 *
 * Shows published battery capacity as a compact mAh headline with a caption.
 *
 * @param batteryMah - Optional published battery capacity.
 * @returns Battery headline and "Capacidad de la batería" caption.
 */
function buildBatteryPresentation(
  batteryMah?: number,
): Pick<CatalogModelSpecs, "batteryPrimaryLabel" | "batterySecondaryLabel"> {
  if (batteryMah) {
    return {
      batteryPrimaryLabel: `${batteryMah.toLocaleString("es-CO")} mAh`,
      batterySecondaryLabel: "Capacidad de la batería",
    };
  }

  return {
    batteryPrimaryLabel: "Batería recargable de iones de litio",
  };
}

/**
 * enrichCatalogModelSpecs
 *
 * Adds Apple-compare presentation fields to a canonical seed row.
 *
 * @param slug - Catalog model slug.
 * @param seed - Base hardware specs.
 * @returns Enriched specs for UI rendering.
 */
function enrichCatalogModelSpecs(
  slug: string,
  seed: CatalogModelSpecsSeed,
): CatalogModelSpecs {
  const camera = buildCameraPresentation(slug, seed.cameras);
  const battery = buildBatteryPresentation(seed.batteryMah);

  return {
    ...seed,
    displayMarketingName: buildDisplayMarketingName(slug),
    chipBadge: extractChipBadge(seed.chip),
    chipHeadline: buildChipHeadline(seed.chip),
    chipDetail: buildChipDetail(slug, seed.chip),
    ...camera,
    ...buildFrontCameraPresentation(slug),
    ...battery,
  };
}

const SPECS_BY_SLUG: Record<string, CatalogModelSpecsSeed> = {
  "iphone-12-mini": {
    displaySizeInches: 5.4,
    resolution: "2340 × 1080 píxeles (476 ppp)",
    ramGb: 4,
    chip: "Apple A14 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 2227,
    uniqueFeatures: ["Ceramic Shield", "MagSafe", "5G"],
  },
  "iphone-12": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 4,
    chip: "Apple A14 Bionic",
    cameras: "Dual 12 MP (gran angular + ultra gran angular)",
    batteryMah: 2815,
    uniqueFeatures: ["Ceramic Shield", "MagSafe", "5G"],
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
      "Zoom óptico 2×",
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
      "Acero inoxidable",
      "Modo Noche en todas las cámaras",
      "ProRAW y Apple ProRes",
      "Zoom óptico 2,5×",
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
      "Ceramic Shield",
      "MagSafe",
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
      "Ceramic Shield",
      "MagSafe",
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
    uniqueFeatures: ["ProMotion hasta 120 Hz", "Fotografía macro", "MagSafe"],
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
      "Fotografía macro",
      "MagSafe",
      "Zoom óptico 3×",
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
    uniqueFeatures: ["Face ID", "Botón de Acción", "USB-C", "MagSafe"],
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
      "Detección de choque y SOS de emergencia",
      "Modo Acción en vídeo",
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
      "ProMotion hasta 120 Hz",
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
    uniqueFeatures: ["Dynamic Island", "USB-C", "Retratos de nueva generación"],
  },
  "iphone-15-pro": {
    displaySizeInches: 6.1,
    resolution: "2556 × 1179 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A17 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 3274,
    uniqueFeatures: [
      "Titanio",
      "Botón de Acción",
      "USB-C con Thunderbolt",
      "Zoom óptico 3×",
    ],
  },
  "iphone-15-pro-max": {
    displaySizeInches: 6.7,
    resolution: "2796 × 1290 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A17 Pro",
    cameras: "Triple 48 MP + escáner LiDAR",
    batteryMah: 4441,
    uniqueFeatures: [
      "Titanio",
      "Botón de Acción",
      "Zoom óptico 5×",
      "USB-C con Thunderbolt",
    ],
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
      "Control de Cámara",
      "Botón de Acción",
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
      "Titanio",
      "Control de Cámara",
      "Botón de Acción",
      "ProMotion hasta 120 Hz",
      "Apple Intelligence",
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
      "Titanio",
      "Control de Cámara",
      "Botón de Acción",
      "ProMotion hasta 120 Hz",
      "Apple Intelligence",
    ],
  },
  "iphone-16e": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A18",
    cameras: "48 MP Fusion",
    batteryMah: 4005,
    uniqueFeatures: ["Face ID", "Botón de Acción", "USB-C", "MagSafe"],
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
      "Botón de Acción",
      "ProMotion hasta 120 Hz",
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
      "Titanio",
      "ProMotion hasta 120 Hz",
      "Control de Cámara",
      "Botón de Acción",
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
      "Control de Cámara",
      "Botón de Acción",
      "ProMotion hasta 120 Hz",
      "Zoom óptico 8×",
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
      "Chasis unibody de aluminio",
      "Control de Cámara",
      "Botón de Acción",
      "ProMotion hasta 120 Hz",
      "Zoom óptico 8×",
    ],
  },
  "iphone-17e": {
    displaySizeInches: 6.1,
    resolution: "2532 × 1170 píxeles (460 ppp)",
    ramGb: 8,
    chip: "Apple A19",
    cameras: "48 MP Fusion",
    batteryMah: 4005,
    uniqueFeatures: ["Ceramic Shield 2", "Botón de Acción", "MagSafe", "USB-C"],
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
  const seed = SPECS_BY_SLUG[slug];
  if (!seed) return null;
  return enrichCatalogModelSpecs(slug, seed);
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

/**
 * Stable compare order for notable features. Shared names stay on the same row.
 */
const UNIQUE_FEATURE_ORDER = [
  "Chasis unibody de aluminio",
  "Titanio",
  "Acero inoxidable",
  "Diseño ultradelgado de 5,6 mm",
  "Diseño compacto clásico",
  "Último iPhone mini",
  "Ceramic Shield 2",
  "Ceramic Shield",
  "Dynamic Island",
  "Always-On display",
  "ProMotion hasta 120 Hz",
  "Control de Cámara",
  "Botón de Acción",
  "Fotografía macro",
  "Zoom óptico 2×",
  "Zoom óptico 2,5×",
  "Zoom óptico 3×",
  "Zoom óptico 5×",
  "Zoom óptico 8×",
  "ProRAW y Apple ProRes",
  "Modo Noche en todas las cámaras",
  "Modo Cine y Fotográficos",
  "Modo Acción en vídeo",
  "Retratos de nueva generación",
  "USB-C con Thunderbolt",
  "USB-C",
  "MagSafe",
  "Apple Intelligence",
  "Face ID",
  "Touch ID en botón Inicio",
  "5G",
  "Detección de choque y SOS de emergencia",
] as const;

export type AlignedUniqueFeature = {
  left: string;
  right: string;
};

/**
 * alignUniqueFeatures
 *
 * Lines up notable features for the two-column compare table.
 *
 * @param left - Unique features for the left model.
 * @param right - Unique features for the right model.
 * @returns One row per feature name, with "—" when a model lacks it.
 * @calledBy UniqueFeaturesCompareRow
 */
export function alignUniqueFeatures(
  left: string[],
  right: string[],
): AlignedUniqueFeature[] {
  const rank = new Map<string, number>(
    UNIQUE_FEATURE_ORDER.map((name, index) => [name, index]),
  );
  const union = [...new Set([...left, ...right])];
  union.sort((a, b) => {
    const leftRank = rank.get(a) ?? 1000;
    const rightRank = rank.get(b) ?? 1000;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return a.localeCompare(b, "es");
  });

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return union.map((feature) => ({
    left: leftSet.has(feature) ? feature : "—",
    right: rightSet.has(feature) ? feature : "—",
  }));
}
