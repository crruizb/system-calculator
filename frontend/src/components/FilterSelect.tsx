import { calcT } from "../utils/calcT";

interface FilterSelectProps {
  field: string;
  value: string;
  options: string[];
  onChange: (field: string, value: string | null) => void;
  disabled?: boolean;
  locale?: string;
}

export default function FilterSelect({
  field,
  value,
  options,
  onChange,
  disabled,
  locale,
}: FilterSelectProps) {
  const t = calcT(locale ?? "es-ES");
  const label = field.charAt(0).toUpperCase() + field.slice(1);

  return (
    <div
      className={`flex flex-col gap-2 transition-opacity duration-[250ms] ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <label
        className="font-body text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-main-muted"
        htmlFor={`filter-${field}`}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={`filter-${field}`}
          className="appearance-none w-full min-h-14 pl-2 pr-12 bg-surface border border-border-line rounded text-text-primary font-body text-base cursor-pointer transition-all outline-none focus:border-main focus:shadow-[0_0_0_2px_var(--color-main-ring)] hover:border-main-muted hover:bg-surface-hover disabled:cursor-not-allowed"
          value={value || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          disabled={disabled}
          aria-label={t("public.selectField", { field: label })}
        >
          <option value="">{t("public.select")}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-main-muted text-base leading-none"
          aria-hidden="true"
        >
          ▾
        </span>
      </div>
    </div>
  );
}
