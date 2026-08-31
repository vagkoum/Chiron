import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TrustBadge } from '../components/TrustBadge'
import { ReviewList } from '../components/Reviews'
import ListingCard from '../components/ListingCard'

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [stats, setStats] = useState({ ideasExchanged: 0, originalIdeasExchanged: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, company, bio, location, avatar_url, banned, deleted')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.banned) { setProfile(null); setLoading(false); return }
        setProfile(data)
        setLoading(false)
      })

    supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(full_name, company, avatar_url)')
      .eq('user_id', userId)
      .eq('active', true)
      .neq('status', 'sold')
      .order('created_at', { ascending: false })
      .then(({ data }) => setListings(data || []))

    async function loadStats() {
      const { count: ideasExchanged } = await supabase
        .from('listing_ownership_history')
        .select('id', { count: 'exact' })
        .eq('seller_id', userId)

      const { count: originalIdeasExchanged } = await supabase
        .from('listings')
        .select('id', { count: 'exact' })
        .eq('original_seller_id', userId)
        .neq('user_id', userId)

      setStats({
        ideasExchanged: ideasExchanged || 0,
        originalIdeasExchanged: originalIdeasExchanged || 0,
      })
    }
    loadStats()
  }, [userId])

  if (loading) return <div className="page"><div className="spinner" /></div>
  if (!profile) return <div className="page"><p>User not found.</p></div>

  const initials = (profile.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="page-narrow">
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '1rem' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="avatar avatar-lg" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="avatar avatar-lg">{initials}</div>
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{profile.full_name || 'Anonymous'}</div>
            {profile.company && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{profile.company}</div>
            )}
            {profile.location && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {profile.location}</div>
            )}
            <div style={{ marginTop: '4px' }}>
              <TrustBadge userId={userId} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F6E56' }}>{stats.ideasExchanged}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ideas exchanged</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F6E56' }}>{stats.originalIdeasExchanged}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Original ideas exchanged</div>
          </div>
        </div>

        {profile.bio && (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{profile.bio}</p>
        )}
      </div>

      <div className="section-header">
        <h2 className="section-title">Active listings</h2>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <h3>No active listings</h3>
          <p>This user doesn't have any active submissions right now.</p>
        </div>
      ) : (
        <div className="grid-listings" style={{ marginBottom: '2rem' }}>
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      <ReviewList reviewedId={userId} />
    </div>
  )
}
