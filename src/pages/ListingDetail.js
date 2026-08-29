import { TrustBadge } from '../components/TrustBadge'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ReviewForm, ReviewList } from '../components/Reviews'
import { ReportButton } from '../components/Report'
import { NDAModal } from '../components/NDA'
import { MapPin, ClipboardList, Calendar, Handshake, MessageCircle, Pause } from 'lucide-react'

function LockIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="-18 -22 36 44" style={{ verticalAlign: '-2px' }}>
      <rect x="-14" y="-2" width="28" height="24" rx="3" fill="none" stroke="#0F6E56" strokeWidth="2.2" />
      <path d="M-8 -2 v-9 a8 8 0 0 1 16 0 v9" fill="none" stroke="#0F6E56" strokeWidth="2.2" />
      <circle cx="0" cy="8" r="1.8" fill="#0F6E56" />
      <line x1="0" y1="10" x2="0" y2="14" stroke="#0F6E56" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BanknoteIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="-22 -14 44 28" style={{ verticalAlign: '-2px' }}>
      <rect x="-20" y="-12" width="40" height="24" rx="4" fill="none" stroke="#0F6E56" strokeWidth="2.2" />
      <circle cx="0" cy="0" r="7" fill="none" stroke="#0F6E56" strokeWidth="1.8" />
    </svg>
  )
}

function ClockIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40" style={{ verticalAlign: '-2px' }}>
      <circle cx="0" cy="0" r="18" fill="none" stroke="#0F6E56" strokeWidth="2.4" />
      <path d="M0 -9 v9 l6 5" fill="none" stroke="#0F6E56" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasThread, setHasThread] = useState(false)
  const [showNDA, setShowNDA] = useState(false)
  const [activeDeal, setActiveDeal] = useState(null)
  const [refreshReviews, setRefreshReviews] = useState(0)
  const [privateDetails, setPrivateDetails] = useState(null)
  const [accessStatus, setAccessStatus] = useState(null)
  const [pastOwnerRole, setPastOwnerRole] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
  if (!user || !listing) return
  supabase
    .from('favorites')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('listing_id', listing.id)
    .maybeSingle()
    .then(({ data }) => setIsFavorite(!!data))
}, [user, listing])

  useEffect(() => {
    if (!listing || !user || user.id === listing.user_id) return
    supabase
      .from('listing_ownership_history')
      .select('seller_id, buyer_id')
      .eq('listing_id', listing.id)
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .then(({ data }) => {
        if (!data || data.length === 0) return setPastOwnerRole(null)
        const wasSeller = data.some(r => r.seller_id === user.id)
        setPastOwnerRole(wasSeller ? 'seller' : 'buyer')
      })
  }, [listing, user])
  useEffect(() => {
  if (!listing || !user) return
  if (user.id === listing.user_id) {
    supabase
      .from('listing_private_details')
      .select('private_details')
      .eq('listing_id', listing.id)
      .maybeSingle()
      .then(({ data }) => setPrivateDetails(data?.private_details || null))
    return
  }
  supabase
    .from('nda_agreements')
    .select('access_status')
    .eq('listing_id', listing.id)
    .eq('user_id', user.id)
    .maybeSingle()
    .then(({ data }) => {
      setAccessStatus(data?.access_status || null)
      if (data?.access_status === 'granted') {
        supabase
          .from('listing_private_details')
          .select('private_details')
          .eq('listing_id', listing.id)
          .maybeSingle()
          .then(({ data: pd }) => setPrivateDetails(pd?.private_details || null))
      }
    })
}, [listing, user])
  
  useEffect(() => {
    supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(full_name, company, bio, location, avatar_url)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setListing(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!user || !listing) return
    supabase
      .from('message_threads')
      .select('id')
      .eq('listing_id', listing.id)
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${listing.user_id}),and(user1_id.eq.${listing.user_id},user2_id.eq.${user.id})`)
      .single()
      .then(({ data }) => setHasThread(!!data))

    supabase.rpc('expire_stale_proposals').then(() => {
      supabase
        .from('deals')
        .select('id, status')
        .eq('listing_id', listing.id)
        .in('status', ['proposed', 'accepted', 'disputed'])
        .single()
        .then(({ data }) => setActiveDeal(data || null))
    })
  }, [user, listing])

  async function openConversation() {
    if (!user) { navigate('/login'); return }
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('listing_id', listing.id)
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${listing.user_id}),and(user1_id.eq.${listing.user_id},user2_id.eq.${user.id})`)
      .single()

    if (existing) {
      navigate(`/messages/${existing.id}`)
    } else {
      const { data: thread } = await supabase
        .from('message_threads')
        .insert({ user1_id: user.id, user2_id: listing.user_id, listing_id: listing.id })
        .select()
        .single()
      navigate(`/messages/${thread.id}`)
      setHasThread(true)
    }
  }

async function toggleFavorite() {
  if (!user) { navigate('/login'); return }
  if (isFavorite) {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id)
    setIsFavorite(false)
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, listing_id: listing.id })
    setIsFavorite(true)
  }
  window.dispatchEvent(new Event('favorites-updated'))
}

  function handleContactClick() {
    if (!user) { navigate('/login'); return }
    const hasCurrentAccess = accessStatus === 'granted' || accessStatus === 'pending' || accessStatus === 'denied'
    if (hasThread && hasCurrentAccess) {
      openConversation()
    } else {
      setShowNDA(true)
    }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>
  if (!listing) return <div className="page"><p>Listing not found.</p></div>

  const isOwn = user?.id === listing.user_id

  if (listing.status === 'sold' && !isOwn && !hasThread) {
    const soldDate = listing.sold_at ? new Date(listing.sold_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
    return (
      <div className="page-narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <button className="btn btn-outline btn-sm" onClick={toggleFavorite} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="18" height="18" viewBox="-40 -40 80 80">
            <path
              d="M0 35 C-18 20, -32 5, -32 -10 C-32 -22, -22 -30, -12 -27 C-6 -25, -1 -19, 0 -14 C1 -19, 6 -25, 12 -27 C22 -30, 32 -22, 32 -10 C32 5, 18 20, 0 35 Z"
              fill={isFavorite ? '#dc2626' : 'none'}
              stroke={isFavorite ? '#dc2626' : '#000000'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
          {isFavorite ? 'Saved' : 'Save'}
        </button>
      </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><LockIcon size={44} /></div>
          <div style={{ display: 'inline-block', background: '#E1F5EE', color: '#0F6E56', fontWeight: 700, fontSize: '13px', padding: '4px 14px', borderRadius: '20px', marginBottom: '1rem', letterSpacing: '1px' }}>EXCHANGED</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {listing.offer_title}
          {activeDeal && (activeDeal.status === 'proposed' || activeDeal.status === 'accepted') && (
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', verticalAlign: 'middle' }}>
              <Handshake size={12} color="#0F6E56" style={{ marginRight: '3px', verticalAlign: '-2px' }} /> Under negotiation
            </span>
          )}
        </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            This submission has been exchanged and its content is no longer publicly available.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem', fontSize: '13px' }}>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '3px' }}>Owner</div>
              <div style={{ fontWeight: 500 }}>{listing.profiles?.full_name || '—'}</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '3px' }}>Acquirer</div>
              <div style={{ fontWeight: 500 }}>{listing.buyer_anonymous ? 'Anonymous' : '—'}</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '3px' }}>Exchanged on</div>
              <div style={{ fontWeight: 500 }}>{soldDate}</div>
            </div>
          </div>
          {listing.sold_certificate_id && (
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              Certificate ID: {listing.sold_certificate_id}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isOwn && listing.active === false && listing.status !== 'sold') {
    return (
      <div className="page-narrow">
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Pause size={44} color="#92400e" /></div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>This listing is currently paused</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            The owner has paused this submission. Check back later or browse other listings.
          </p>
        </div>
      </div>
    )
  }
  const name = listing.profiles?.full_name || 'Anonymous'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const skills = listing.skills ? listing.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  const canSeePrivate = isOwn || hasThread

  return (
    <div className="page-narrow">
      {showNDA && (
        <NDAModal
          listing={listing}
          onAgreed={() => { setShowNDA(false); openConversation() }}
          onCancel={() => setShowNDA(false)}
        />
      )}

      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '1rem' }}>
          {listing.profiles?.avatar_url ? (
            <img src={listing.profiles.avatar_url} alt="" className="avatar avatar-lg" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="avatar avatar-lg">{initials}</div>
          )}
          <div>
            <div
              style={{ fontWeight: 600, fontSize: '16px', cursor: 'pointer', color: '#0F6E56' }}
              onClick={() => navigate(`/profile/${listing.user_id}`)}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {name}
            </div>
            {listing.profiles?.company && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{listing.profiles.company}</div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span className={`pill ${listing.user_type === 'business' ? 'pill-blue' : 'pill-purple'}`}>
                {listing.user_type === 'business' ? 'Company / Lab' : 'Individual / Researcher'}
              </span>
              <span className="pill pill-gray">{listing.category}</span>
              <TrustBadge userId={listing.user_id} />
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {listing.offer_title}
          {pastOwnerRole && (
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#e6f1fb', color: '#0c447c' }}>
              <ClockIcon /> You previously {pastOwnerRole === 'seller' ? 'owned' : 'acquired'} this listing
            </span>
          )}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>{listing.offer_description}</p>

        {(canSeePrivate) && (
          <div style={{ marginBottom: '1rem' }}>
            {isOwn && privateDetails && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '6px' }}><LockIcon /> Private details</div>
                <div style={{ fontSize: '14px', color: '#166534', lineHeight: 1.7 }}>{privateDetails}</div>
              </div>
            )}
            {!isOwn && accessStatus === 'granted' && privateDetails && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '6px' }}><LockIcon /> Private details — access granted</div>
                <div style={{ fontSize: '14px', color: '#166534', lineHeight: 1.7 }}>{privateDetails}</div>
              </div>
            )}
            {!isOwn && accessStatus === 'pending' && (
              <div style={{ background: '#fef9f0', border: '1px dashed #f59e0b', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#92400e' }}><LockIcon /> Waiting for seller approval to view private details.</div>
              </div>
            )}
            {!isOwn && accessStatus === 'denied' && (
              <div style={{ background: '#fee2e2', border: '1px dashed #dc2626', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#991b1b' }}><LockIcon /> The seller has not approved access to private details.</div>
              </div>
            )}
            {!isOwn && accessStatus === 'revoked' && (
              <div style={{ background: '#fee2e2', border: '1px dashed #dc2626', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#991b1b' }}><LockIcon /> Your access was revoked after the deal ended. Sign a new NDA to request access again.</div>
              </div>
            )}
          </div>
        )}
        {listing.seek_description && (
          <div style={{ background: 'var(--green-light)', borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-dark)', marginBottom: '4px' }}>↔ Looking for in return</div>
            <div style={{ fontSize: '14px', color: 'var(--green-dark)' }}>{listing.seek_description}</div>
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1rem' }}>
            {skills.map(s => <span key={s} className="pill pill-gray">{s}</span>)}
          </div>
        )}

        <hr className="divider" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <div><strong><MapPin size={13} color="#0F6E56" style={{ verticalAlign: '-2px' }} /> Location</strong><br />{listing.location || '—'}</div>
          <div><strong><ClipboardList size={13} color="#0F6E56" style={{ verticalAlign: '-2px' }} /> Status</strong><br />{listing.availability}</div>
          <div><strong><BanknoteIcon /> Deal type</strong><br />{listing.trade_type === 'barter' ? 'Non-monetary' : listing.trade_type === 'paid' ? 'Monetary' : 'Open to all'}</div>
        </div>

        {listing.submitted_at && (
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '1rem' }}>
            <Calendar size={12} color="#0F6E56" style={{ verticalAlign: '-2px' }} /> Submitted: {new Date(listing.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <TrustBadge userId={listing.user_id} showDetails={true} />
        </div>

        {!isOwn && (
          <>
            {activeDeal && !hasThread ? (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                  <Handshake size={14} color="#0F6E56" style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Deal in progress
                </div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  This submission is currently under negotiation with another party.
                  It will become available again once the current deal is completed, cancelled, or released.
                </div>
              </div>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleContactClick}
                >
                  {hasThread ? (<><MessageCircle size={15} color="#0F6E56" style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Continue conversation with {name.split(' ')[0]}</>) : (<><LockIcon size={15} /> Sign NDA & contact {name.split(' ')[0]}</>)}
                </button>
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {!hasThread && 'A Non-Disclosure Agreement is required before contacting'}
                </div>
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <ReportButton reportedUserId={listing.user_id} listingId={listing.id} />
            </div>
          </>
        )}

        {isOwn && (
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '8px' }}>This is your submission.</div>
        )}

        <hr className="divider" />
        <ReviewList reviewedId={listing.user_id} key={refreshReviews} />
        <ReviewForm
          reviewedId={listing.user_id}
          listingId={listing.id}
          onSubmitted={() => setRefreshReviews(r => r + 1)}
        />
      </div>
    </div>
  )
}
