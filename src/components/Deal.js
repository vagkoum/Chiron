import { openCertificate } from '../lib/certificate'
import { canStartDeal, updateTrustScore } from '../lib/trustScore'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STATUS_LABELS = {
  proposed: { label: 'Proposed', color: '#92400e', bg: '#fef3c7', icon: '📋' },
  accepted: { label: 'In Progress', color: '#0c447c', bg: '#e6f1fb', icon: '🤝' },
  completed: { label: 'Completed', color: '#0F6E56', bg: '#E1F5EE', icon: '✅' },
  disputed: { label: 'Disputed', color: '#991b1b', bg: '#fee2e2', icon: '⚠️' },
  declined: { label: 'Declined', color: '#6b6b6b', bg: '#f0efe8', icon: '❌' },
  released: { label: 'Released', color: '#6b6b6b', bg: '#f0efe8', icon: '🔓' },
}

export function DealPanel({ threadId, listingId, otherUserId, otherUserName }) {
  const { user } = useAuth()
  const [deal, setDeal] = useState(null)
  const [completedDeals, setCompletedDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPropose, setShowPropose] = useState(false)
  const [terms, setTerms] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDeal()
  }, [threadId])

  async function loadDeal() {
    await supabase.rpc('expire_stale_proposals')

    const { data: activeData } = await supabase
      .from('deals')
      .select('*, proposer:profiles!deals_proposer_id_fkey(full_name), receiver:profiles!deals_receiver_id_fkey(full_name)')
      .eq('thread_id', threadId)
      .in('status', ['proposed', 'accepted', 'disputed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setDeal(activeData || null)

    const { data: completedData } = await supabase
      .from('deals')
      .select('*, proposer:profiles!deals_proposer_id_fkey(full_name), receiver:profiles!deals_receiver_id_fkey(full_name)')
      .eq('thread_id', threadId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
    setCompletedDeals(completedData || [])

    setLoading(false)
  }

  async function viewCertificateFor(completedDeal) {
    const { data: listingData } = await supabase
      .from('listings')
      .select('*')
      .eq('id', completedDeal.listing_id)
      .single()
    const { data: historyRow } = await supabase
      .from('listing_ownership_history')
      .select('seller_id, buyer_id')
      .eq('deal_id', completedDeal.id)
      .single()
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', historyRow?.seller_id)
      .single()
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', historyRow?.buyer_id)
      .single()
    openCertificate({
      certId: completedDeal.sold_certificate_id || listingData?.sold_certificate_id || '—',
      listingTitle: listingData?.offer_title || '—',
      sellerName: sellerProfile?.full_name || '—',
      buyerName: buyerProfile?.full_name || '—',
      buyerAnonymous: false,
      submittedAt: listingData?.submitted_at,
      soldAt: completedDeal.updated_at,
      category: listingData?.category,
    })
  }

  async function proposeDeal() {
    if (!terms.trim()) return
    setSubmitting(true)
    const { allowed, reason } = await canStartDeal(user.id)
    if (!allowed) {
      alert(reason)
      setSubmitting(false)
      return
    }

    const { data: existingActive } = await supabase
      .from('deals')
      .select('id')
      .eq('listing_id', listingId)
      .in('status', ['proposed', 'accepted', 'disputed'])
      .maybeSingle()

    if (existingActive) {
      alert('This listing already has an active negotiation with another party. Please try again once it is resolved.')
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase.from('deals').insert({
      listing_id: listingId,
      proposer_id: user.id,
      receiver_id: otherUserId,
      thread_id: threadId,
      terms: terms.trim(),
      status: 'proposed',
    }).select().single()

    if (error) {
      if (error.code === '23505') {
        alert('Someone else just proposed a deal on this listing a moment ago. Please try again later.')
      }
      setSubmitting(false)
      return
    }

    setDeal(data)
    setShowPropose(false)
    setTerms('')
    await updateTrustScore(user.id, 'DEAL_STARTED')
    window.dispatchEvent(new Event('deals-updated'))
    setSubmitting(false)
  }

  async function respondToDeal(accept) {
    setSubmitting(true)
    const { data } = await supabase
      .from('deals')
      .update({ status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
      .eq('id', deal.id)
      .select().single()
    setDeal(accept ? data : null)
    if (!accept) {
      await updateTrustScore(deal.proposer_id, 'DEAL_ENDED')
      await supabase.rpc('revoke_access_on_decline', { p_deal_id: deal.id })
      window.dispatchEvent(new Event('access-requests-updated'))
    }
    window.dispatchEvent(new Event('deals-updated'))
    setSubmitting(false)
  }

  async function confirmCompletion() {
    setSubmitting(true)
    const isProposer = user.id === deal.proposer_id
    const newProposerConfirmed = isProposer ? true : deal.proposer_confirmed
    const newReceiverConfirmed = !isProposer ? true : deal.receiver_confirmed
    const updates = isProposer ? { proposer_confirmed: true } : { receiver_confirmed: true }
    updates.updated_at = new Date().toISOString()

    const { data } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', deal.id)
      .select().single()
    setDeal(data)

    if (newProposerConfirmed && newReceiverConfirmed) {
      const { error: transferError } = await supabase.rpc('complete_deal_and_transfer', { p_deal_id: deal.id })
      if (transferError) {
        alert('Something went wrong finalizing the deal: ' + transferError.message)
        setSubmitting(false)
        return
      }
      window.dispatchEvent(new Event('deals-updated'))

      await updateTrustScore(deal.proposer_id, 'DEAL_COMPLETED')
      await updateTrustScore(deal.receiver_id, 'DEAL_COMPLETED')

      await loadDeal()

      const { data: listingData } = await supabase
        .from('listings')
        .select('*')
        .eq('id', deal.listing_id)
        .single()

      const { data: historyRow } = await supabase
        .from('listing_ownership_history')
        .select('seller_id, buyer_id')
        .eq('deal_id', deal.id)
        .single()

      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', historyRow?.seller_id)
        .single()

      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', historyRow?.buyer_id)
        .single()

      openCertificate({
        certId: listingData?.sold_certificate_id || '—',
        listingTitle: listingData?.offer_title || '—',
        sellerName: sellerProfile?.full_name || '—',
        buyerName: buyerProfile?.full_name || '—',
        buyerAnonymous: false,
        submittedAt: listingData?.submitted_at,
        soldAt: listingData?.sold_at,
        category: listingData?.category,
      })
    }
    setSubmitting(false)
  }

  async function disputeDeal() {
    if (!window.confirm('Are you sure you want to dispute this deal? The listing will be locked for 48 hours before being freed. This action cannot be undone.')) return
    setSubmitting(true)
    const { data } = await supabase
      .from('deals')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString(),
        disputed_at: new Date().toISOString()
      })
      .eq('id', deal.id)
      .select().single()
    setDeal(data)
    await updateTrustScore(user.id, 'DISPUTE_INITIATED')
    setSubmitting(false)
  }

  async function releaseListing() {
    setSubmitting(true)
    const { data } = await supabase
      .from('deals')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', deal.id)
      .select().single()
    setDeal(null)
    setSubmitting(false)
  }

  if (loading) return null

  const isProposer = deal && user.id === deal.proposer_id
  const isReceiver = deal && user.id === deal.receiver_id
  const myConfirmed = deal && (isProposer ? deal.proposer_confirmed : deal.receiver_confirmed)
  const otherConfirmed = deal && (isProposer ? deal.receiver_confirmed : deal.proposer_confirmed)
  const statusInfo = deal ? STATUS_LABELS[deal.status] : null

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: 'var(--bg)' }}>

      {!deal && !showPropose && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active deal for this listing</span>
          <button className="btn btn-outline btn-sm" onClick={() => setShowPropose(true)}>
            🤝 Propose a deal
          </button>
        </div>
      )}

      {showPropose && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>📋 Propose a deal</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Describe the terms you are proposing — what each party offers, timeline, and any conditions.
          </div>
          <textarea
            className="form-textarea"
            style={{ width: '100%', minHeight: '80px', fontSize: '13px', marginBottom: '8px' }}
            placeholder="e.g. I will purchase the rights to your lyrics for €500, payment via bank transfer within 7 days of agreement..."
            value={terms}
            onChange={e => setTerms(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={proposeDeal} disabled={submitting || !terms.trim()}>
              {submitting ? 'Sending…' : 'Send proposal'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setShowPropose(false); setTerms('') }}>Cancel</button>
          </div>
        </div>
      )}

      {deal && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Deal status:</span>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: statusInfo.bg, color: statusInfo.color, fontWeight: 500
            }}>{statusInfo.label}</span>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Proposed by {deal.proposer?.full_name} · {new Date(deal.created_at).toLocaleDateString()}
            </div>
            <div style={{ lineHeight: 1.6 }}>{deal.terms}</div>
          </div>

          {deal.status === 'proposed' && isReceiver && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => respondToDeal(true)} disabled={submitting}>✓ Accept deal</button>
              <button className="btn btn-danger btn-sm" onClick={() => respondToDeal(false)} disabled={submitting}>✗ Decline</button>
            </div>
          )}

          {deal.status === 'proposed' && (() => {
            const deadline = new Date(new Date(deal.created_at).getTime() + 48 * 60 * 60 * 1000)
            const hoursLeft = Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60)))
            return (
              <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '6px' }}>
                ⏱ Expires in {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''} if there's no response
              </div>
            )
          })()}

          {deal.status === 'proposed' && isProposer && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Waiting for {otherUserName} to respond…</div>
          )}

          {deal.status === 'accepted' && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Both parties must confirm completion:</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: deal.proposer_confirmed ? '#E1F5EE' : '#f0efe8', color: deal.proposer_confirmed ? '#0F6E56' : 'var(--text-muted)' }}>
                  {deal.proposer?.full_name}: {deal.proposer_confirmed ? '✓ Confirmed' : 'Pending'}
                </span>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: deal.receiver_confirmed ? '#E1F5EE' : '#f0efe8', color: deal.receiver_confirmed ? '#0F6E56' : 'var(--text-muted)' }}>
                  {deal.receiver?.full_name}: {deal.receiver_confirmed ? '✓ Confirmed' : 'Pending'}
                </span>
              </div>
              {!myConfirmed && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={confirmCompletion} disabled={submitting}>✓ Confirm deal completed</button>
                  <button className="btn btn-danger btn-sm" onClick={disputeDeal} disabled={submitting}>⚠️ Dispute</button>
                </div>
              )}
              {myConfirmed && !otherConfirmed && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You confirmed. Waiting for {otherUserName} to confirm…</div>
              )}
            </div>
          )}

          {deal.status === 'disputed' && (() => {
            const disputedAt = deal.disputed_at ? new Date(deal.disputed_at) : new Date(deal.updated_at)
            const releaseTime = new Date(disputedAt.getTime() + 48 * 60 * 60 * 1000)
            const now = new Date()
            const hoursLeft = Math.max(0, Math.ceil((releaseTime - now) / (1000 * 60 * 60)))
            const canRelease = now >= releaseTime
            return (
              <div>
                <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px', fontWeight: 500 }}>
                  ⚠️ This deal has been disputed.
                </div>
                {!canRelease ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: '#fef3c7', borderRadius: '6px', padding: '8px 10px' }}>
                    🕐 The listing will be freed in approximately <strong>{hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}</strong>.
                    This cooling period gives both parties time to resolve the situation.
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      The 48-hour cooling period has ended. The listing can now be freed.
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={releaseListing} disabled={submitting}>
                      Release listing
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {completedDeals.length > 0 && (
        <div style={{ marginTop: deal ? '14px' : '0', paddingTop: deal ? '14px' : '0', borderTop: deal ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            📜 Past completed deals on this listing
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {completedDeals.map(cd => (
              <div key={cd.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  ✅ Completed {new Date(cd.updated_at).toLocaleDateString()}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => viewCertificateFor(cd)}>
                  📄 View Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
