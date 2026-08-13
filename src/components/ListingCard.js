import { useNavigate } from 'react-router-dom'
import { TrustBadge } from './TrustBadge'

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
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span className={`pill ${listing.user_type === 'business' ? 'pill-blue' : 'pill-purple'}`}>
              {listing.user_type === 'business' ? 'Company / Lab' : 'Individual / Researcher'}
            </span>
            {!listing.has_private_details && (
              <span className="pill" style={{ background: '#fef3c7', color: '#92400e' }}>⚠️ No private details</span>
            )}
            <TrustBadge userId={listing.user_id} />
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{listing.offer_title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.offer_description}
        </div>
      </div>

      {listing.status === 'sold' ? (
        <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
          <span style={{ color: '#0F6E56', fontWeight: 700, fontSize: '12px', letterSpacing: '1px' }}>🔒 SOLD</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>
            {listing.sold_at ? new Date(listing.sold_at).toLocaleDateString() : ''}
          </span>
        </div>
      ) : (
        skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {skills.slice(0, 4).map(s => <span key={s} className="pill pill-gray">{s}</span>)}
            {skills.length > 4 && <span className="pill pill-gray">+{skills.length - 4}</span>}
          </div>
        )
      )}

      <hr className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>⏱ {listing.availability}</span>
        <span style={{ color: 'var(--green)', fontWeight: 500 }}>
          {listing.trade_type === 'barter' ? '🔄 Non-monetary' : listing.trade_type === 'paid' ? '💶 Monetary' : '🔄💶 Open to all'}
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
