import { useEffect, useRef } from "react";

interface PriceDisplayProps {
  price: string | null;
  currency?: string;
  allSelected: boolean;
}

export default function PriceDisplay({ price, currency = "€", allSelected }: PriceDisplayProps) {
  const prevRef = useRef<string | null>(null);
  const numRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (price !== prevRef.current && numRef.current) {
      numRef.current.classList.remove("pop");
      void numRef.current.offsetWidth; // reflow
      numRef.current.classList.add("pop");
      prevRef.current = price;
    }
  }, [price]);

  return (
    <div
      className={`p-8 px-7 bg-surface border rounded-md text-center transition-all duration-[400ms] min-h-[120px] flex flex-col items-center justify-center gap-2 ${
        price
          ? "border-gold-muted shadow-[0_0_40px_rgba(201,168,76,0.08),0_2px_16px_rgba(0,0,0,0.4)]"
          : "border-border-line"
      }`}
    >
      <p className="font-body text-[0.65rem] tracking-[0.18em] uppercase text-text-muted m-0">
        Precio calculado
      </p>
      <div className="flex items-baseline gap-1" ref={numRef}>
        {price ? (
          <>
            <span className="font-display text-[2rem] font-light text-gold-muted leading-none">{currency}</span>
            <span className="font-display text-[4rem] font-semibold leading-none text-gold tracking-[-0.02em]">
              {parseFloat(price).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </>
        ) : (
          <span className="font-body text-sm text-text-dim italic">
            {allSelected ? "Sin coincidencia" : "Selecciona todas las opciones"}
          </span>
        )}
      </div>
      {price && (
        <div className="w-10 h-px bg-gradient-to-r from-transparent via-gold-muted to-transparent mt-1" />
      )}
    </div>
  );
}
