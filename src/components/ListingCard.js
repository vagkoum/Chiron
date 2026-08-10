import { useNavigate } from 'react-router-dom'

export default function ListingCard({ listing }) {
  const navigate = useNavigate()
  const name = listing.profiles?.full_name || 'Anonymous'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const skills = listing.skills ? listing.skills.split(',').map(s => s.trim()).filter(Boolean) : []

  return (
    <div className="listing-card" onClick={() => navigate(`/listing/${listing.id}`)}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {listing.profiles?.company && `${listing.profiles.company} · `}
            {listing.location || 'Location not set'}
          </div>
        </div>
        <span className={`pill ${listing.user_type === 'business' ? 'pill-blue' : 'pill-purple'}`}>
          {listing.user_type === 'business' ? 'Company / Lab' : 'Individual / Researcher'}
        </span>
        {!listing.private_details && (
          <span className="pill" style={{ background: '#fef3c7', color: '#92400e' }}>⚠️ No private details</span>
        )}
      </div>

      <div>
        <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{listing.offer_title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.offer_description}
        </div>
      </div>

      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {skills.slice(0, 4).map(s => <span key={s} className="pill pill-gray">{s}</span>)}
          {skills.length > 4 && <span className="pill pill-gray">+{skills.length - 4}</span>}
        </div>
      )}

      <hr className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>⏱ {listing.availability}</span>
        <span style={{ color: 'var(--green)', fontWeight: 500 }}>
          {listing.trade_type === 'barter' ? '🔄 Barter' : listing.trade_type === 'paid' ? '💶 Paid' : '🔄💶 Open'}
        </span>
      </div>
      {listing.seek_description && (
        <div style={{ fontSize: '12px', color: 'var(--green-dark)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
          ↔ Looking for: {listing.seek_description}
        </div>
      )}
    </div>
  )
}
