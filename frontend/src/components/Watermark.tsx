export function Watermark() {
  return (
    <div className="mt-6 text-center text-xs text-[var(--color-text-secondary,#666)] opacity-60">
      Powered by{' '}
      <a
        href="/"
        className="underline hover:opacity-100 transition-opacity"
        target="_blank"
        rel="noopener noreferrer"
      >
        Prexario
      </a>
    </div>
  )
}
