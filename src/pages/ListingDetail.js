import { TrustBadge } from '../components/TrustBadge'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ReviewForm, ReviewList } from '../components/Reviews'
import { ReportButton } from '../components/Report'
import { NDAModal } from '../components/NDA'


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
  const [refreshReviews, setRefreshReviews] = useState(0)
  const [privateDetails, setPrivateDetails] = useState(null)

  useEffect(() => {
  if (!listing) return
  supabase
    .from('listing_private_details')
    .select('private_details')
    .eq('listing_id', listing.id)
    .maybeSingle()
    .then(({ data }) => setPrivateDetails(data?.private_details || null))
}, [listing])
  
  useEffect(() => {
    supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(full_name, company, bio, location)')
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

    supabase
      .from('deals')
      .select('id, status')
      .eq('listing_id', listing.id)
      .in('status', ['proposed', 'accepted', 'disputed'])
      .single()
      .then(({ data }) => setActiveDeal(data || null))
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

  function handleContactClick() {
    if (!user) { navigate('/login'); return }
    if (hasThread) {
      openConversation()
    } else {
      setShowNDA(true)
    }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>
  if (!listing) return <div className="page"><p>Listing not found.</p></div>
  // SOLD listing — show minimal info to non-participants
  if (listing.status === 'sold' && !isOwn && !hasThread) {
    const soldDate = listing.sold_at ? new Date(listing.sold_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
    return (
      <div className="page-narrow">
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔒</div>
          <div style={{ display: 'inline-block', background: '#E1F5EE', color: '#0F6E56', fontWeight: 700, fontSize: '13px', padding: '4px 14px', borderRadius: '20px', marginBottom: '1rem', letterSpacing: '1px' }}>SOLD</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{listing.offer_title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            This submission has been sold and its content is no longer publicly available.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem', fontSize: '13px' }}>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '3px' }}>Seller</div>
              <div style={{ fontWeight: 500 }}>{listing.profiles?.full_name || '—'}</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '3px' }}>Buyer</div>
              <div style={{ fontWeight: 500 }}>{listing.buyer_anonymous ? 'Anonymous' : '—'}</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '3px' }}>Sold on</div>
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
  const name = listing.profiles?.full_name || 'Anonymous'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const skills = listing.skills ? listing.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  const isOwn = user?.id === listing.user_id
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
          <div className="avatar avatar-lg">{initials}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{name}</div>
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

        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{listing.offer_title}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>{listing.offer_description}</p>

        {(canSeePrivate ? privateDetails : true) && (
          <div style={{ marginBottom: '1rem' }}>
            {canSeePrivate ? (
              privateDetails && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '6px' }}>🔒 Private details — visible only after NDA agreement</div>
                  <div style={{ fontSize: '14px', color: '#166534', lineHeight: 1.7 }}>{privateDetails}</div>
                </div>
               )
             ) : (
              <div style={{ background: '#fef9f0', border: '1px dashed #f59e0b', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '6px' }}>🔒 This submission has private details</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You must agree to a Non-Disclosure Agreement before accessing private details and contacting the author.</div>
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
          <div><strong>📍 Location</strong><br />{listing.location || '—'}</div>
          <div><strong>📋 Status</strong><br />{listing.availability}</div>
          <div><strong>💶 Deal type</strong><br />{listing.trade_type === 'barter' ? 'Non-monetary' : listing.trade_type === 'paid' ? 'Monetary' : 'Open to all'}</div>
        </div>

        {listing.submitted_at && (
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '1rem' }}>
            📅 Submitted: {new Date(listing.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                  🤝 Deal in progress
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
                  {hasThread ? `💬 Continue conversation with ${name.split(' ')[0]}` : `🔒 Sign NDA & contact ${name.split(' ')[0]}`}
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
