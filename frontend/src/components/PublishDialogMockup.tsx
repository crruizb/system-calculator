export function PublishDialogMockup() {
  return (
    <div style={{
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid #dadce0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 13,
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      background: '#fff',
    }}>
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#ea4335', '#fbbc04', '#34a853'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ color: '#3c4043', fontSize: 12, fontWeight: 600, marginLeft: 4 }}>Publish to the web</span>
      </div>
      <div style={{ padding: '16px' }}>
        <p style={{ color: '#5f6368', fontSize: 12, marginBottom: 12 }}>
          Make your content visible to anyone by publishing it to the web.
        </p>
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 12 }}>
          <div style={{ padding: '6px 16px', borderBottom: '2px solid #1a73e8', color: '#1a73e8', fontSize: 12, fontWeight: 600 }}>Link</div>
          <div style={{ padding: '6px 16px', color: '#5f6368', fontSize: 12 }}>Embed</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #dadce0',
            borderRadius: 4,
            fontSize: 12,
            color: '#3c4043',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Sheet1</span>
            <span style={{ color: '#5f6368' }}>▾</span>
          </div>
          <div style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #1a73e8',
            borderRadius: 4,
            fontSize: 12,
            color: '#1a73e8',
            background: '#e8f0fe',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Comma-separated values (.csv)</span>
            <span>▾</span>
          </div>
        </div>
        <div style={{
          padding: '6px 10px',
          border: '1px solid #dadce0',
          borderRadius: 4,
          fontSize: 11,
          color: '#1a73e8',
          background: '#f8f9fa',
          marginBottom: 12,
          wordBreak: 'break-all',
        }}>
          https://docs.google.com/spreadsheets/d/e/…/pub?output=csv
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            padding: '8px 20px',
            background: '#1a73e8',
            color: '#fff',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
          }}>
            Publish
          </div>
        </div>
      </div>
    </div>
  )
}
