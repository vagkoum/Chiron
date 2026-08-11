import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import ListingCard from '../components/ListingCard'

export default function Home() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])

  useEffect(() => {
    supabase
      .from('listings')
      .select('*, profiles(full_name, company)')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setListings(data || []))
  }, [])

  return (
    <>
      <div className="hero" style={{background: '#faf5ee'}}>
        <h1><em>{TRADE_CONFIG.heroTagline.split(',')[0]}</em>{TRADE_CONFIG.heroTagline.includes(',') ? ',' + TRADE_CONFIG.heroTagline.split(',').slice(1).join(',') : ''}</h1>
        <p>{TRADE_CONFIG.heroSubtitle}</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate('/browse')}>
            Browse {TRADE_CONFIG.listingNamePlural}
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/new-listing')}>
            Post a {TRADE_CONFIG.listingName}
          </button>
        </div>
      </div>

      <div className="page">
        <div className="section-header">
          <h2 className="section-title">Recent {TRADE_CONFIG.listingNamePlural}</h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/browse')}>See all →</button>
        </div>

        {listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings yet</h3>
            <p>Be the first to post one!</p>
          </div>
        ) : (
          <div className="grid-listings">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '12px' }}>
          {[
            { icon: '🤝', title: 'Post what you offer', text: 'Describe who or what you can trade.' },
            { icon: '🔍', title: 'Find a match', text: 'Our system surfaces the best mutual fits.' },
            { icon: '💬', title: 'Connect & agree', text: 'Chat directly and finalise the terms.' },
            { icon: '🔄', title: 'Complete the trade', text: 'Barter or paid — you decide together.' },
          ].map(s => (
            <div key={s.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
