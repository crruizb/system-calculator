import { useMemo } from "react";
import { SheetRow, getFilteredValues, matchPrice } from "../utils/filters";
import FilterSelect from "./FilterSelect";
import PriceDisplay from "./PriceDisplay";

interface PriceCalculatorProps {
  instanceId: string;
  data: SheetRow[];
  filterFields: string[];
  filters: Record<string, string | undefined>;
  onFiltersChange: (id: string, filters: Record<string, string | undefined>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}

export default function PriceCalculator({
  instanceId,
  data,
  filterFields,
  filters,
  onFiltersChange,
  onRemove,
  showRemove,
}: PriceCalculatorProps) {
  const handleChange = (field: string, value: string | null) => {
    const next = { ...filters, [field]: value ?? undefined };
    const idx = filterFields.indexOf(field);
    filterFields.slice(idx + 1).forEach((f) => {
      delete next[f];
    });
    onFiltersChange(instanceId, next);
  };

  const price = useMemo(
    () => matchPrice(data, filters, filterFields),
    [data, filters, filterFields],
  );

  const allSelected = filterFields.every((f) => filters[f]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Filters */}
      <section
        className="flex flex-col gap-5"
        aria-label="Opciones del producto"
      >
        {filterFields.map((field, i) => {
          const prevField = filterFields[i - 1];
          const isLocked = i > 0 && !filters[prevField];
          const options = getFilteredValues(data, field, filters);

          return (
            <FilterSelect
              key={field}
              field={field}
              value={filters[field] ?? ""}
              options={options}
              onChange={handleChange}
              disabled={isLocked}
            />
          );
        })}
      </section>

      {/* Price result */}
      <PriceDisplay price={price} allSelected={allSelected} />

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          className="min-h-13 px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-border-line bg-transparent text-text-muted hover:border-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => onFiltersChange(instanceId, {})}
          disabled={Object.keys(filters).length === 0}
          aria-label="Limpiar selección"
        >
          Limpiar
        </button>
        {showRemove && (
          <button
            className="min-h-13 px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-border-line bg-transparent text-text-muted hover:border-text-muted hover:text-text-primary"
            onClick={() => onRemove(instanceId)}
            aria-label="Eliminar calculadora"
          >
            ✕ Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
