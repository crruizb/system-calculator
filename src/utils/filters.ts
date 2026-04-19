export type SheetRow = Record<string, string>;

/**
 * Returns all columns except "precio" (the filter fields).
 */
export function getFilterFields(data: SheetRow[]): string[] {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]).filter(
    (k) => k.toLowerCase() !== "precio" && k.trim() !== ""
  );
}

/**
 * Returns unique values for a field across all data rows.
 */
export function getUniqueValues(data: SheetRow[], field: string): string[] {
  return [...new Set(data.map((item) => item[field]).filter(Boolean))];
}

/**
 * Returns valid values for a field given current active filters
 * (dependent filtering: only show combinations that still exist).
 */
export function getFilteredValues(
  data: SheetRow[],
  field: string,
  activeFilters: Record<string, string | undefined>
): string[] {
  const relevant = data.filter((item) =>
    Object.entries(activeFilters).every(
      ([k, v]) => k === field || !v || item[k] === v
    )
  );
  return [...new Set(relevant.map((item) => item[field]).filter(Boolean))];
}

/**
 * Finds the price for the exact combination of filter values.
 * Returns the price string or null if no match.
 */
export function matchPrice(
  data: SheetRow[],
  filters: Record<string, string | undefined>,
  filterFields: string[]
): string | null {
  if (filterFields.length === 0) return null;
  const allSelected = filterFields.every((f) => filters[f]);
  if (!allSelected) return null;

  const match = data.find((item) =>
    filterFields.every((field) => item[field] === filters[field])
  );
  return match ? (match.precio ?? match.Precio ?? null) : null;
}
