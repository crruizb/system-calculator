interface InstanceSummary {
  filters: Record<string, string | undefined>;
  price: string | null;
}

interface PriceSummaryProps {
  instances: InstanceSummary[];
  filterFields: string[];
}

export default function PriceSummary({
  instances,
  filterFields,
}: PriceSummaryProps) {
  const resolved = instances
    .map((inst) => ({
      filters: inst.filters,
      value: parseFloat(inst.price ?? ""),
    }))
    .filter((inst) => !isNaN(inst.value));

  if (instances.length < 2 || resolved.length === 0) return null;

  const total = resolved.reduce((a, b) => a + b.value, 0);

  return (
    <div className="animate-fade-up border-t border-gold-dim pt-6 flex flex-col items-center gap-4">
      <p className="font-body text-[0.65rem] tracking-[0.18em] uppercase text-text-muted">
        Total combinado
      </p>

      {/* Per-instance breakdown */}
      <div className="w-full flex flex-col gap-3">
        {resolved.map((inst, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-4 py-3 rounded border border-border-line bg-surface"
          >
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-3 gap-y-0.5 sm:gap-y-1">
              {filterFields.map((field) =>
                inst.filters[field] ? (
                  <span
                    key={field}
                    className="font-body text-[0.72rem] text-text-muted"
                  >
                    <span className="capitalize text-text-muted">{field}:</span>{" "}
                    <span className="text-text-primary">
                      {inst.filters[field]}
                    </span>
                  </span>
                ) : null,
              )}
            </div>
            <span className="font-display text-[1.1rem] font-semibold text-gold whitespace-nowrap self-end sm:self-auto">
              {inst.value.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[1.5rem] font-light text-gold-muted leading-none">
          €
        </span>
        <span className="font-display text-[3rem] font-semibold leading-none text-gold tracking-[-0.02em]">
          {total.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
      <div className="w-10 h-px bg-linear-to-r from-transparent via-gold-muted to-transparent" />
      {resolved.length < instances.length && (
        <p className="font-body text-[0.65rem] tracking-[0.12em] text-text-muted">
          {resolved.length} de {instances.length} calculadoras con precio
        </p>
      )}
    </div>
  );
}
