import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

function scoreMatch(myListing, theirListing) {
  let score = 0
  // Skill overlap
  const mySkills = (myListing.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
  const theirSkills = (theirListing.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
  const mySeek = (myListing.seek_description || '').toLowerCase()
  const theirOffer = (theirListing.offer_description || '').toLowerCase()
  const theirSeek = (theirListing.seek_description || '').toLowerCase()
  const myOffer = (myListing.offer_description || '').toLowerCase()

  // Their skills appear in my seek description
  theirSkills.forEach(s => { if (mySeek.includes(s)) score += 15 })
  // My skills appear in their seek description
  mySkills.forEach(s => { if (theirSeek.includes(s)) score += 15 })
  // Keyword overlap in descriptions
  theirOffer.split(' ').forEach(w => { if (w.length > 4 && mySeek.includes(w)) score += 3 })
  myOffer.split(' ').forEach(w => { if (w.length > 4 && theirSeek.includes(w)) score += 3 })
  // Same category bonus
  if (myListing.category !== theirListing.category) score += 5
  // Trade type compatible
  if (myListing.trade_type === theirListing.trade_type || myListing.trade_type === 'both' || theirListing.trade_type === 'both') score += 10

  return Math.min(score, 99)
}

export default function Matches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myListings, setMyListings] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: mine } = await supabase.from('listings').select('*').eq('user_id', user.id).eq('active', true)
      const { data: others } = await supabase
        .from('listings')
        .select('*, profiles!listings_user_id_fkey(full_name, company)')
        .neq('user_id', user.id)
        .eq('active', true)

      setMyListings(mine || [])

      if (!mine?.length || !others?.length) { setLoading(false); return }

      const scored = others.map(l => {
        const bestScore = Math.max(...(mine || []).map(m => scoreMatch(m, l)))
        return { ...l, score: bestScore }
      }).filter(l => l.score > 10).sort((a, b) => b.score - a.score).slice(0, 10)

      setMatches(scored)
      setLoading(false)
    }
    load()
  }, [user])

  async function handleContact(listing) {
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${listing.user_id}),and(user1_id.eq.${listing.user_id},user2_id.eq.${user.id})`)
      .single()

    if (existing) { navigate(`/messages/${existing.id}`); return }

    const { data: thread } = await supabase
      .from('message_threads')
      .insert({ user1_id: user.id, user2_id: listing.user_id, listing_id: listing.id })
      .select().single()
    navigate(`/messages/${thread.id}`)
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="stats-row">
        <div className="stat-card"><div className="stat-num">{myListings.length}</div><div className="stat-lbl">Your active listings</div></div>
        <div className="stat-card"><div className="stat-num">{matches.length}</div><div className="stat-lbl">Potential matches</div></div>
        <div className="stat-card"><div className="stat-num">{matches.filter(m => m.score >= 50).length}</div><div className="stat-lbl">Strong matches</div></div>
      </div>

      <h2 className="section-title" style={{ marginBottom: '1rem' }}>Your best matches</h2>

      {myListings.length === 0 ? (
        <div className="empty-state">
          <h3>Post a listing first</h3>
          <p>We need to know what you're offering to find matches.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/new-listing')}>Post a listing</button>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <h3>No matches yet</h3>
          <p>Check back as more people join the platform.</p>
        </div>
      ) : (
        matches.map(m => {
          const name = m.profiles?.full_name || 'Anonymous'
          const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={m.id} className="match-card">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="avatar avatar-lg">{initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{m.offer_title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="match-score">{m.score}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>match</div>
                </div>
              </div>
              <div className="match-bar-wrap"><div className="match-bar" style={{ width: `${m.score}%` }} /></div>
              {m.seek_description && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  They're looking for: {m.seek_description}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleContact(m)}>Message</button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/listing/${m.id}`)}>View listing</button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
