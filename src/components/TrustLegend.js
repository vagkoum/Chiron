export default function TrustLegend() {
  const levels = [
    { key: 'new', color: '#a05a2c', label: 'New', desc: '0–9 points. Everyone starts here.' },
    { key: 'trusted', color: '#8a8a8a', label: 'Trusted', desc: '10–29 points, up to 5 active deals.' },
    { key: 'verified', color: '#c9971f', label: 'Verified', desc: '30+ points, up to 10 active deals.' },
  ]
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Trust badges</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {levels.map(l => (
          <div key={l.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <svg width="18" height="23.5" viewBox="0 0 26 34" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M10 2 L8 10 L13 13 L18 10 L16 2 Z" fill="none" stroke={l.color} strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="13" cy="22" r="10" fill="none" stroke={l.color} strokeWidth="2.4" />
              <circle cx="13" cy="22" r="5.5" fill={l.color} />
            </svg>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>{l.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <a href="/how-it-works" style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: '#0F6E56', fontWeight: 500 }}>
        How trust points work →
      </a>
    </div>
  )
}
