type Locale = 'en' | 'es'

const data: Record<Locale, { title: string; label: string; fields: { label: string; value: string }[] }> = {
  en: {
    title: 'Online Printing',
    label: 'Calculated price',
    fields: [
      { label: 'Format', value: 'A3' },
      { label: 'Material', value: 'Coated' },
      { label: 'Quantity', value: '500' },
      { label: 'Finish', value: 'Laminated' },
    ],
  },
  es: {
    title: 'Imprenta Online',
    label: 'Precio calculado',
    fields: [
      { label: 'Formato', value: 'A3' },
      { label: 'Material', value: 'Couché' },
      { label: 'Cantidad', value: '500' },
      { label: 'Acabado', value: 'Plastificado' },
    ],
  },
}

export function CalculatorMockup({ locale = 'en' }: { locale?: Locale }) {
  const { title, label, fields } = data[locale]

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--color-border-line)',
      background: 'var(--color-surface)',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 2px 16px rgba(99,102,241,0.08)',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-line)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Prexario</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(({ label: fieldLabel, value }) => (
          <div key={fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 56, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fieldLabel}</span>
            <div style={{
              flex: 1,
              padding: '5px 10px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-line)',
              borderRadius: 5,
              fontSize: 12,
              color: 'var(--color-text-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{value}</span>
              <span style={{ color: 'var(--color-gold)', fontSize: 10 }}>▾</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        margin: '0 20px 20px',
        padding: '14px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-gold)',
        borderRadius: 8,
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(99,102,241,0.10)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: 20, color: 'var(--color-gold)', fontWeight: 300 }}>€</span>
          <span style={{ fontSize: 36, color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '-0.02em' }}>89</span>
        </div>
      </div>
    </div>
  )
}
