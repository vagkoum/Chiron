import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import ListingCard from '../components/ListingCard'
import TrustLegend from '../components/TrustLegend'
import { Handshake, Search, MessageCircle, Repeat, Lock, Award, Lightbulb, Globe } from 'lucide-react'
import SplashScreen from '../components/SplashScreen'

export default function Home() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('chiron_splash_seen'))

  function dismissSplash() {
  sessionStorage.setItem('chiron_splash_seen', 'true')
  setShowSplash(false)
}

  useEffect(() => {
    supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(full_name, company, avatar_url)')
      .eq('active', true)
      .eq('removed', false)
      .neq('status', 'sold')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setListings(data || []))
  }, [])
  return (
    <>
      {showSplash && <SplashScreen onDone={dismissSplash} />}
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

      <div className="page" style={{ paddingBottom: 0 }}>
        <p style={{
          fontSize: '18px', textAlign: 'center', color: 'var(--text)',
          maxWidth: '520px', margin: '0 auto 2rem', lineHeight: 1.6,
        }}>
          Worried that sharing your idea means losing it? That's exactly the problem Chiron is built to solve.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '3rem' }}>
          {[
            { Icon: Lock, title: 'Share it safely', text: "Nothing sensitive is shown until someone signs a confidentiality agreement — and you decide who actually gets access, not the platform." },
            { Icon: Award, title: 'Keep the credit, forever', text: 'Every completed exchange is permanently recorded — who created it, and who acquired it — giving you a timestamped record of the transaction, should you ever need one.' },
            { Icon: Lightbulb, title: 'Room for every kind of idea', text: "Scientific research, inventions, lab collaborations, lyrics, screenplays — Chiron isn't built around just one field." },
            { Icon: Globe, title: 'Reach past your usual network', text: "Filter and discover by language, country, and audience — collaborations you'd likely never stumble into otherwise." },
          ].map(s => (
            <div key={s.title} className="card" style={{ padding: '1.1rem 1.25rem' }}>
              <s.Icon size={22} color="#0F6E56" />
              <div style={{ fontWeight: 600, fontSize: '15px', margin: '8px 0 4px' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page">
        <div className="home-sidebar-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: '20px' }}>
            <TrustLegend />
          </div>
          <div>
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
          </div>
        </div>

        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { Icon: Handshake, title: 'Post what you offer', text: 'Describe who or what you can trade.' },
            { Icon: Search, title: 'Find a match', text: 'Our system surfaces the best mutual fits.' },
            { Icon: MessageCircle, title: 'Connect & agree', text: 'Chat directly and finalise the terms.' },
            { Icon: Repeat, title: 'Complete the trade', text: 'Barter or paid — you decide together.' },
          ].map(s => (
            <div key={s.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><s.Icon size={28} color="#0F6E56" /></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
