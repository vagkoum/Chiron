import { useNavigate } from 'react-router-dom'

// Renders plain markdown-ish legal text: **bold headings/labels**, blank-line
// separated paragraphs, and "-   " bullet lines. Kept deliberately simple —
// this is a static legal document, not rich content.
export default function LegalDocument({ title, content }) {
  const navigate = useNavigate()

  const blocks = content.split(/\n\s*\n/)

  return (
    <div className="page-narrow">
      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1rem' }}
        title="Go back to the previous page"
      >
        ← Back
      </button>

      <div className="card" style={{ lineHeight: 1.7, fontSize: '14px' }}>
        {blocks.map((block, i) => {
          const trimmed = block.trim()
          if (!trimmed) return null

          // Whole-block bold line, e.g. **1. THE OPERATOR** -> heading
          const boldOnlyMatch = trimmed.match(/^\*\*(.+)\*\*$/)
          if (boldOnlyMatch) {
            const text = boldOnlyMatch[1]
            const isPart = /^Part [A-Z]/i.test(text)
            return (
              <h2
                key={i}
                style={{
                  fontSize: isPart ? '13px' : '16px',
                  fontWeight: 700,
                  color: isPart ? 'var(--text-muted)' : 'var(--text)',
                  letterSpacing: isPart ? '1px' : 'normal',
                  textTransform: isPart ? 'uppercase' : 'none',
                  marginTop: isPart ? '2rem' : '1.5rem',
                  marginBottom: '0.75rem',
                  borderBottom: isPart ? 'none' : '1px solid var(--border)',
                  paddingBottom: isPart ? '0' : '6px',
                }}
              >
                {text}
              </h2>
            )
          }

          // Bullet list block — handles both "-   item" and "> • item" / "> item" styles
          const lines = trimmed.split('\n').map(l => l.trim())
          const isBulletBlock = lines.every(l => l.startsWith('-') || l.startsWith('>') || l === '')
          if (isBulletBlock && lines.some(l => l.startsWith('-') || l.startsWith('>'))) {
            // Join continuation lines back into single bullet items first
            const rawItems = []
            let current = ''
            lines.forEach(l => {
              const cleaned = l.replace(/^>\s*/, '').replace(/^-+\s*/, '').replace(/^•\s*/, '')
              if (l.match(/^(-|>\s*•)/) ) {
                if (current) rawItems.push(current)
                current = cleaned
              } else if (cleaned) {
                current += (current ? ' ' : '') + cleaned
              }
            })
            if (current) rawItems.push(current)

            return (
              <ul key={i} style={{ margin: '0 0 1rem', paddingLeft: '1.4rem' }}>
                {rawItems.map((item, j) => (
                  <li key={j} style={{ marginBottom: '6px' }}>
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            )
          }
          // Regular paragraph (may contain inline bold, and internal line breaks)
          return (
            <p key={i} style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              {renderInline(trimmed)}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function renderInline(text) {
  // Split on **bold** segments and render them as <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    if (m) return <strong key={i}>{m[1]}</strong>
    return <span key={i}>{part}</span>
  })
}
