import { useState, useMemo } from "react";
import { useSheetData } from "./hooks/useSheetData";
import { getFilterFields, matchPrice, SheetRow } from "./utils/filters";
import PriceCalculator from "./components/PriceCalculator";
import PriceSummary from "./components/PriceSummary";
import LoadingSpinner from "./components/LoadingSpinner";

const SHEET_URL = import.meta.env.VITE_SHEET_URL ?? "";

interface CalculatorInstance {
  id: string;
  filters: Record<string, string | undefined>;
}

export default function App() {
  const { data, loading, error, refresh } = useSheetData(SHEET_URL);
  const filterFields = useMemo(() => getFilterFields(data), [data]);

  const [instances, setInstances] = useState<CalculatorInstance[]>([
    { id: crypto.randomUUID(), filters: {} },
  ]);
  const [activeId, setActiveId] = useState<string>(instances[0].id);

  const addInstance = () => {
    const id = crypto.randomUUID();
    setInstances((prev) => [...prev, { id, filters: {} }]);
    setActiveId(id);
  };

  const removeInstance = (id: string) => {
    setInstances((prev) => {
      const next = prev.filter((inst) => inst.id !== id);
      if (activeId === id) {
        const removedIdx = prev.findIndex((inst) => inst.id === id);
        setActiveId(next[Math.max(0, removedIdx - 1)].id);
      }
      return next;
    });
  };

  const updateFilters = (
    id: string,
    filters: Record<string, string | undefined>,
  ) =>
    setInstances((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, filters } : inst)),
    );

  const prices = useMemo(
    () => instances.map((inst) => matchPrice(data, inst.filters, filterFields)),
    [instances, data, filterFields],
  );

  const activeInst =
    instances.find((inst) => inst.id === activeId) ?? instances[0];

  return (
    <div className="w-full max-w-xl mx-auto px-6 pt-8 pb-12 flex flex-col gap-8 animate-fade-up">
      {/* Header */}
      <header className="text-center flex flex-col items-center gap-[0.6rem]">
        <div
          className="text-xl text-gold animate-pulse-gold"
          aria-hidden="true"
        >
          ◆
        </div>
        <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-medium tracking-[0.04em] text-text-primary">
          JUDjoies
        </h1>
        {error && (
          <p className="font-body text-xs text-error">
            ⚠ {error} — usando caché local
          </p>
        )}
      </header>

      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border-line pb-0 -mb-4">
            {instances.map((inst, idx) => {
              const isActive = inst.id === activeId;
              return (
                <div key={inst.id} className="relative flex items-center">
                  <button
                    onClick={() => setActiveId(inst.id)}
                    className={`px-4 py-2 font-body text-[0.75rem] tracking-[0.08em] uppercase transition-all cursor-pointer rounded-t border-t border-x ${
                      isActive
                        ? "border-border-line bg-surface text-text-primary -mb-px pb-2.25"
                        : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {idx + 1}
                    {prices[idx] != null && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-gold align-middle -mt-0.5" />
                    )}
                  </button>
                  {instances.length > 1 && (
                    <button
                      onClick={() => removeInstance(inst.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-surface border border-border-line text-gold hover:text-text-primary hover:border-text-muted flex items-center justify-center cursor-pointer text-[0.6rem] leading-none"
                      aria-label={`Eliminar calculadora ${idx + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={addInstance}
              className="px-3 py-2 font-body text-[0.85rem] hover:text-gold transition-colors cursor-pointer"
              aria-label="Añadir calculadora"
            >
              +
            </button>
          </div>

          {/* Active calculator */}
          <div key={activeId} className="flex flex-col gap-8 animate-fade-up">
            <PriceCalculator
              instanceId={activeInst.id}
              data={data as SheetRow[]}
              filterFields={filterFields}
              filters={activeInst.filters}
              onFiltersChange={updateFilters}
              onRemove={removeInstance}
              showRemove={false}
            />
          </div>

          {/* Summary — always visible */}
          <PriceSummary
            instances={instances.map((inst, idx) => ({
              filters: inst.filters,
              price: prices[idx],
            }))}
            filterFields={filterFields}
          />

          {/* Refresh */}
          <div className="flex justify-center">
            <button
              className="min-h-13 px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-[rgba(201,168,76,0.3)] bg-transparent text-gold-muted hover:bg-[rgba(201,168,76,0.08)] hover:border-gold-muted hover:text-gold"
              onClick={refresh}
              aria-label="Actualizar datos desde la hoja"
            >
              ↺ Actualizar datos
            </button>
          </div>
        </>
      )}

      <footer className="text-center pt-2 border-t border-border-line">
        <p className="font-body text-[0.7rem] text-text-muted tracking-[0.04em]">
          Los precios se actualizan automáticamente desde la hoja de cálculo.
        </p>
      </footer>
    </div>
  );
}
