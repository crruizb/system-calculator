import { useMemo } from "react";
import { SheetRow, getFilteredValues, matchPrice } from "../utils/filters";
import FilterSelect from "./FilterSelect";
import PriceDisplay from "./PriceDisplay";
import { calcT } from "../utils/calcT";

interface PriceCalculatorProps {
  instanceId: string;
  data: SheetRow[];
  filterFields: string[];
  filters: Record<string, string | undefined>;
  onFiltersChange: (id: string, filters: Record<string, string | undefined>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
  currency?: string;
  locale?: string;
}

export default function PriceCalculator({
  instanceId,
  data,
  filterFields,
  filters,
  onFiltersChange,
  onRemove,
  showRemove,
  currency,
  locale,
}: PriceCalculatorProps) {
  const t = calcT(locale ?? "es-ES");

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
    <div className="w-full flex flex-col md:flex-row md:gap-10 gap-8 py-6">
      {/* Filters — left */}
      <section
        className="flex-1 flex flex-col gap-5"
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
              locale={locale}
            />
          );
        })}
      </section>

      {/* Price + actions — right, sticky on desktop */}
      <div className="md:w-72 md:sticky md:top-8 md:self-start flex flex-col gap-6">
        <PriceDisplay price={price} allSelected={allSelected} currency={currency} locale={locale} />

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            className="min-h-13 px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-border-line bg-transparent text-text-muted hover:border-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => onFiltersChange(instanceId, {})}
            disabled={Object.keys(filters).length === 0}
          >
            {t("public.clear")}
          </button>
          {showRemove && (
            <button
              className="min-h-13 px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-border-line bg-transparent text-text-muted hover:border-text-muted hover:text-text-primary"
              onClick={() => onRemove(instanceId)}
            >
              {t("public.remove")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
