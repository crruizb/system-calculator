import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="max-w-4xl mx-auto px-8 py-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/diamond.png" alt="logo" className="h-8" />
          <span className="font-display text-xl">PriceCalc</span>
        </div>
        <nav className="flex gap-6 text-sm">
          <Link to="/login" className="hover:text-[var(--color-gold)] transition-colors">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors">
            Get started free
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-24 text-center">
        <h1 className="font-display text-6xl mb-6 leading-tight">
          Price calculators<br />for any product
        </h1>
        <p className="text-lg text-[var(--color-text-primary)]/60 mb-12 max-w-xl mx-auto">
          Connect a Google Sheet, get a shareable calculator URL. No code required.
        </p>
        <Link to="/register"
          className="inline-block px-8 py-4 rounded-xl bg-[var(--color-gold)] text-black text-lg font-semibold hover:bg-[var(--color-gold-muted)] transition-colors">
          Start for free
        </Link>
      </main>

      <section className="max-w-4xl mx-auto px-8 py-16 grid grid-cols-3 gap-8 text-center">
        {[
          { title: 'Connect your sheet', body: 'Paste a Google Sheets export URL. Columns become filter dropdowns automatically.' },
          { title: 'Share the link', body: 'Each calculator gets a URL you can embed or share directly with customers.' },
          { title: 'Upgrade for branding', body: 'Remove the watermark and apply your own colors and logo on the Pro plan.' },
        ].map(({ title, body }) => (
          <div key={title} className="p-6 bg-[var(--color-surface)] rounded-2xl text-left">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-primary)]/50">{body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
