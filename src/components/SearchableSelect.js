import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-input"
        placeholder={placeholder || 'Search...'}
        value={open ? query : value}
        onFocus={() => { setOpen(true); setQuery('') }}
        onChange={e => setQuery(e.target.value)}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
          maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', marginTop: '4px'
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>No matches</div>
          )}
          {filtered.map(o => (
            <div
              key={o}
              onClick={() => { onChange(o); setOpen(false); setQuery('') }}
              style={{
                padding: '8px 12px', fontSize: '13px', cursor: 'pointer',
                background: o === value ? 'var(--bg)' : 'transparent'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = o === value ? 'var(--bg)' : 'transparent'}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
