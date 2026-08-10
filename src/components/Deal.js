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
  const [loading, setLoading] = useState(true)
  const [showPropose, setShowPropose] = useState(false)
  const [terms, setTerms] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDeal()
  }, [threadId])

  async function loadDeal() {
    const { data } = await supabase
      .from('deals')
      .select('*, proposer:profiles!deals_proposer_id_fkey(full_name), receiver:profiles!deals_receiver_id_fkey(full_name)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setDeal(data || null)
    setLoading(false)
  }

  async function proposeDeal() {
    if (!terms.trim()) return
    setSubmitting(true)

    // Check deal limit
    const { allowed, reason } = await canStartDeal(user.id)
    if (!allowed) {
      alert(reason)
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
    if (!error) {
      setDeal(data)
      setShowPropose(false)
      setTerms('')
      await updateTrustScore(user.id, 'DEAL_STARTED')
    }
    setSubmitting(false)
  }

  async function respondToDeal(accept) {
    setSubmitting(true)
    const { data } = await supabase
      .from('deals')
      .update({ status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
      .eq('id', deal.id)
      .select().single()
    setDeal(data)
    if (!accept) {
      await updateTrustScore(deal.proposer_id, 'DEAL_ENDED')
    }
    setSubmitting(false)
  }

  async function confirmCompletion() {
    setSubmitting(true)
    const isProposer = user.id === deal.proposer_id
    const updates = isProposer
      ? { proposer_confirmed: true }
      : { receiver_confirmed: true }

    const newProposerConfirmed = isProposer ? true : deal.proposer_confirmed
    const newReceiverConfirmed = !isProposer ? true : deal.receiver_confirmed

    if (newProposerConfirmed && newReceiverConfirmed) {
      updates.status = 'completed'
    }
    updates.updated_at = new Date().toISOString()

    const { data } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', deal.id)
      .select().single()
    setDeal(data)

    if (newProposerConfirmed && newReceiverConfirmed) {
      await updateTrustScore(deal.proposer_id, 'DEAL_COMPLETED')
      await updateTrustScore(deal.receiver_id, 'DEAL_COMPLETED')
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
    setSubmitting(false)
  }

  async function releaseListing() {
    setSubmitting(true)
    const { data } = await supabase
      .from('deals')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', deal.id)
      .select().single()
    setDeal(data)
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

          {deal.status === 'completed' && (
            <div style={{ fontSize: '12px', color: '#0F6E56', fontWeight: 500 }}>
              🎉 Deal completed! You can now leave a review for {otherUserName}.
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

          {deal.status === 'declined' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deal was declined.</span>
              <button className="btn btn-outline btn-sm" onClick={() => { setDeal(null); setShowPropose(true) }}>Propose new deal</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
