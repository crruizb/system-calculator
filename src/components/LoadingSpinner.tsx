interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Cargando datos…",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-65">
      <div className="spin-ring">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="font-body text-sm text-text-muted tracking-[0.08em] uppercase">
        {message}
      </p>
    </div>
  );
}
