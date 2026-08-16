/**
 * @file colombia-cities.ts
 * @description Colombia department/city select options and profile city persistence helpers.
 * @dependencies none
 */

/**
 * Colombia location options for profile (MVP).
 * Premium shipping applies ONLY when city === CITY_BOGOTA
 * (typically paired with department DEPARTMENT_BOGOTA_DC).
 */

export const CITY_BOGOTA = "Bogotá";
export const CITY_BOGOTA_SURROUNDINGS = "Alrededores de Bogotá";
export const CITY_OTHER = "Otra";

export const DEPARTMENT_BOGOTA_DC = "Bogotá D.C.";

/** 32 departments + Bogotá D.C. */
export const COLOMBIA_DEPARTMENT_OPTIONS = [
  DEPARTMENT_BOGOTA_DC,
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

export type ColombiaDepartmentOption =
  (typeof COLOMBIA_DEPARTMENT_OPTIONS)[number];

/** Top cities + Bogotá surroundings + other (manual entry). */
export const COLOMBIA_CITY_OPTIONS = [
  CITY_BOGOTA,
  CITY_BOGOTA_SURROUNDINGS,
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  CITY_OTHER,
] as const;

export type ColombiaCityOption = (typeof COLOMBIA_CITY_OPTIONS)[number];

/**
 * isColombiaDepartmentOption
 *
 * Type guard for known Colombia department select values.
 *
 * @param value - Candidate string.
 * @returns True when value is in COLOMBIA_DEPARTMENT_OPTIONS.
 * @calledBy Profile location form validation
 */
export function isColombiaDepartmentOption(
  value: string | null | undefined,
): value is ColombiaDepartmentOption {
  return (
    typeof value === "string" &&
    (COLOMBIA_DEPARTMENT_OPTIONS as readonly string[]).includes(value)
  );
}

/**
 * isColombiaCityOption
 *
 * Type guard for known city option select values.
 *
 * @param value - Candidate string.
 * @returns True when value is in COLOMBIA_CITY_OPTIONS.
 * @calledBy Profile location form validation
 */
export function isColombiaCityOption(
  value: string | null | undefined,
): value is ColombiaCityOption {
  return (
    typeof value === "string" &&
    (COLOMBIA_CITY_OPTIONS as readonly string[]).includes(value)
  );
}

/**
 * cityOptionNeedsDetail
 *
 * Whether the city option requires a free-text detail field.
 *
 * @param cityOption - Selected city option.
 * @returns True for Otra and Alrededores de Bogotá.
 * @calledBy Profile location form UI
 */
export function cityOptionNeedsDetail(cityOption: string): boolean {
  return cityOption === CITY_OTHER || cityOption === CITY_BOGOTA_SURROUNDINGS;
}

/** Map stored department into a select value. */
/**
 * resolveDepartmentSelectValue
 *
 * Maps a persisted department string back to a select option value.
 *
 * @param department - Stored department or nullish.
 * @returns Matching option or empty string.
 * @calledBy Profile edit form initial state
 */
export function resolveDepartmentSelectValue(
  department: string | null | undefined,
): string {
  if (!department) return "";
  if (isColombiaDepartmentOption(department)) return department;
  const normalized = department
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (
    normalized === "bogota" ||
    normalized === "bogota d.c" ||
    normalized === "bogota dc" ||
    normalized === "bogota d.c." ||
    normalized === "distrito capital"
  ) {
    return DEPARTMENT_BOGOTA_DC;
  }
  return "";
}

/** Map legacy / stored city into a select option + optional detail text. */
/**
 * resolveCityFormState
 *
 * Reconstructs city select + detail fields from a persisted city string.
 *
 * @param city - Stored city or nullish.
 * @returns cityOption and cityDetail for the form.
 * @calledBy Profile edit form, isBogotaCity legacy path
 */
export function resolveCityFormState(city: string | null | undefined): {
  cityOption: string;
  cityDetail: string;
} {
  if (!city) return { cityOption: "", cityDetail: "" };
  if (city === CITY_BOGOTA) return { cityOption: CITY_BOGOTA, cityDetail: "" };
  if (city === CITY_BOGOTA_SURROUNDINGS) {
    return { cityOption: CITY_BOGOTA_SURROUNDINGS, cityDetail: "" };
  }
  if (isColombiaCityOption(city) && !cityOptionNeedsDetail(city)) {
    return { cityOption: city, cityDetail: "" };
  }

  const normalized = city
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (
    normalized === "bogota" ||
    normalized === "bogota d.c" ||
    normalized === "bogota dc" ||
    normalized === "bogota d.c."
  ) {
    return { cityOption: CITY_BOGOTA, cityDetail: "" };
  }

  return { cityOption: CITY_OTHER, cityDetail: city };
}

/**
 * Value persisted on Profile.city.
 * - Named city option → that label
 * - Otra / Alrededores → trimmed free-text detail (required)
 */
/**
 * resolvePersistedCity
 *
 * Computes the city string to store from department/city form fields.
 * Bogotá D.C. always persists as canonical Bogotá.
 *
 * @param input.department - Selected department.
 * @param input.cityOption - Selected city option.
 * @param input.cityDetail - Free-text detail when needed.
 * @returns Persisted city string.
 * @calledBy Profile save actions, shipping eligibility tests
 */
export function resolvePersistedCity(input: {
  department: string;
  cityOption: string;
  cityDetail: string;
}): string {
  if (input.department === DEPARTMENT_BOGOTA_DC) {
    return CITY_BOGOTA;
  }
  if (!input.cityOption) return "";
  if (cityOptionNeedsDetail(input.cityOption)) {
    return input.cityDetail.trim();
  }
  return input.cityOption;
}
