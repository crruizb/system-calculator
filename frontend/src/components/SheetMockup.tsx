type Locale = 'en' | 'es'

const data: Record<Locale, { file: string; cols: string[]; rows: string[][] }> = {
  en: {
    file: 'printing-catalog.xlsx — Google Sheets',
    cols: ['format', 'material', 'quantity', 'finish', 'price'],
    rows: [
      ['A4', 'Standard', '100', 'Unlaminated', '25'],
      ['A4', 'Standard', '500', 'Unlaminated', '45'],
      ['A4', 'Coated', '100', 'Laminated', '38'],
      ['A4', 'Coated', '500', 'Laminated', '68'],
      ['A3', 'Standard', '100', 'Unlaminated', '35'],
      ['A3', 'Coated', '100', 'Laminated', '52'],
      ['A3', 'Coated', '500', 'Laminated', '89'],
      ['Banner', 'Canvas', '1', 'Unlaminated', '65'],
    ],
  },
  es: {
    file: 'tarifas-imprenta.xlsx — Google Sheets',
    cols: ['formato', 'material', 'cantidad', 'acabado', 'price'],
    rows: [
      ['A4', 'Estándar', '100', 'Normal', '25'],
      ['A4', 'Estándar', '500', 'Normal', '45'],
      ['A4', 'Couché', '100', 'Plastificado', '38'],
      ['A4', 'Couché', '500', 'Plastificado', '68'],
      ['A3', 'Estándar', '100', 'Normal', '35'],
      ['A3', 'Couché', '100', 'Plastificado', '52'],
      ['A3', 'Couché', '500', 'Plastificado', '89'],
      ['Banner', 'Lona', '1', 'Normal', '65'],
    ],
  },
}

export function SheetMockup({ locale = 'en' }: { locale?: Locale }) {
  const { file, cols, rows } = data[locale]
  const priceCol = cols.length - 1

  return (
    <div style={{
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid #dadce0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      background: '#fff',
    }}>
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#ea4335', '#fbbc04', '#34a853'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ color: '#5f6368', fontSize: 11, marginLeft: 4 }}>{file}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${cols.length}, 1fr)`, background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ padding: '4px 8px', color: '#999', borderRight: '1px solid #e0e0e0', textAlign: 'center' }} />
        {cols.map((c, i) => (
          <div
            key={c}
            style={{
              padding: '4px 8px',
              color: i === priceCol ? '#1a73e8' : '#3c4043',
              fontWeight: 600,
              borderRight: i < cols.length - 1 ? '1px solid #e0e0e0' : 'none',
              textAlign: i === priceCol ? 'right' : 'left',
            }}
          >
            {c}
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: `40px repeat(${cols.length}, 1fr)`,
            borderBottom: '1px solid #f0f0f0',
            background: ri % 2 === 0 ? '#fff' : '#fafafa',
          }}
        >
          <div style={{ padding: '3px 8px', color: '#999', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{ri + 1}</div>
          {row.map((cell, ci) => (
            <div
              key={ci}
              style={{
                padding: '3px 8px',
                color: ci === priceCol ? '#1a73e8' : ci === 0 ? '#5f6368' : '#3c4043',
                fontWeight: ci === priceCol ? 600 : 400,
                borderRight: ci < row.length - 1 ? '1px solid #e0e0e0' : 'none',
                textAlign: ci === priceCol ? 'right' : 'left',
              }}
            >
              {ci === priceCol ? `€${cell}` : cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
