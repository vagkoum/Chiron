import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Check, X } from 'lucide-react'

function LockIcon({ size = 16, color = '#0F6E56' }) {
  return (
    <svg width={size} height={size} viewBox="-18 -20 36 42" style={{ verticalAlign: '-2px' }}>
      <rect x="-14" y="-2" width="28" height="22" rx="3" fill="none" stroke={color} strokeWidth="3" />
      <path d="M-8 -2 v-9 a8 8 0 0 1 16 0 v9" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="0" cy="7" r="1.8" fill={color} />
      <line x1="0" y1="9" x2="0" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function NDAModal({ listing, onAgreed, onCancel }) {
  const { user } = useAuth()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alreadySigned, setAlreadySigned] = useState(false)
  const [isReturning, setIsReturning] = useState(false)

  const listingOwnerName = listing.profiles?.full_name || 'the listing owner'
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user) return
    supabase
      .from('nda_agreements')
      .select('id, agreed_at, access_status')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .order('agreed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setIsReturning(true)
        const isCurrentCycle = listing.owner_since && new Date(data.agreed_at) > new Date(listing.owner_since)
        if (isCurrentCycle && data.access_status !== 'revoked') {
          setAlreadySigned(true)
          onAgreed()
        }
      })
  }, [user, listing.id, listing.owner_since])

    async function handleAgree() {
    if (!agreed) return
    if (listing.active === false) {
      alert('This listing is currently paused and is not accepting new NDA agreements.')
      onCancel()
      return
    }
    setLoading(true)
    const { error } = await supabase.from('nda_agreements').insert({
      user_id: user.id,
      listing_id: listing.id,
      listing_owner_id: listing.user_id,
    })
    if (error && error.code !== '23505') {
      setLoading(false)
      return
    }
    setLoading(false)
    onAgreed()
  }

  if (alreadySigned) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: '14px',
          maxWidth: '560px', width: '100%',
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <LockIcon size={20} />
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Non-Disclosure Agreement</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isReturning
              ? 'This listing has changed ownership or been updated since you last agreed to its terms. A new agreement is required to view current private details and reach out again.'
              : 'You must agree to the following terms before contacting this user.'}
          </p>
        </div>

        {/* NDA Text */}
        <div style={{ padding: '1.25rem 1.5rem', fontSize: '13px', lineHeight: 1.8, color: 'var(--text)', maxHeight: '340px', overflowY: 'auto' }}>
          <p style={{ marginBottom: '12px', fontWeight: 500 }}>
            NON-DISCLOSURE AGREEMENT — {today}
          </p>

          <p style={{ marginBottom: '10px' }}>
            This Non-Disclosure Agreement ("Agreement") is entered into between you ("Recipient") and {listingOwnerName} ("Discloser"), the owner of the listing titled <strong>"{listing.offer_title}"</strong> on the Chiron platform (chironevo.com).
          </p>

          <p style={{ marginBottom: '8px', fontWeight: 500 }}>By agreeing, you confirm that:</p>

          <ol style={{ paddingLeft: '1.5rem', marginBottom: '10px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Confidentiality:</strong> Any information shared by the Discloser in the context of this listing — whether in messages, private details, documents, or any other form — is confidential and must not be disclosed to any third party without the Discloser's prior written consent.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Non-use:</strong> You will not use any information shared by the Discloser for any purpose other than evaluating a potential collaboration, purchase, or agreement related to this specific listing.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>No reproduction:</strong> You will not copy, reproduce, publish, or distribute any information shared by the Discloser without their explicit written permission.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Intellectual property:</strong> You acknowledge that all ideas, inventions, creative works, or other intellectual property shared by the Discloser remain the exclusive property of the Discloser unless a formal written agreement stating otherwise is signed by both parties.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Duration:</strong> This agreement remains in effect for 3 years from the date of signing, or until the information becomes publicly available through no fault of the Recipient.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Governing law:</strong> This Agreement is governed by the laws of Greece. Any disputes shall be subject to the jurisdiction of the courts of Athens, Greece.
            </li>
          </ol>

          <p style={{ marginBottom: '10px' }}>
            <strong>Platform disclaimer:</strong> Chiron acts only as the platform facilitating this connection and is not a party to this Agreement. The Discloser and Recipient are solely responsible for enforcing this Agreement between themselves.
          </p>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
            This agreement is digitally recorded with your user ID, the listing ID, and a timestamp on the Chiron platform as evidence of your acceptance. Date: {today}.
          </p>
        </div>

        {/* Agreement checkbox and buttons */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>
              I have read and agree to this Non-Disclosure Agreement. I understand that by agreeing, I am legally bound by these terms and my acceptance is digitally recorded with a timestamp.
            </span>
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handleAgree}
              disabled={!agreed || loading}
              style={{ flex: 1, justifyContent: 'center' }}
              title="Agree to the NDA and continue"
            >
              {loading ? 'Recording agreement…' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Check size={14} color="#ffffff" /> I agree — {isReturning ? 'Sign new agreement' : 'Continue to contact'}
                </span>
              )}
            </button>
            <button className="btn btn-outline" onClick={onCancel} title="Close without agreeing">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export function AccessRequestPanel({ listingId, listingOwnerId, otherUserId, isOwner }) {
  const { user } = useAuth()
  const [ndaRecord, setNdaRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const buyerId = isOwner ? otherUserId : user.id
    supabase
      .from('nda_agreements')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', buyerId)
      .maybeSingle()
      .then(({ data }) => { setNdaRecord(data); setLoading(false) })
  }, [listingId, otherUserId, isOwner])

  async function respond(grant) {
    setSubmitting(true)
    const { data } = await supabase
      .from('nda_agreements')
      .update({ access_status: grant ? 'granted' : 'denied', access_decided_at: new Date().toISOString() })
      .eq('id', ndaRecord.id)
      .select().single()
    setNdaRecord(data)
    setSubmitting(false)
    window.dispatchEvent(new Event('access-requests-updated'))
  }

  if (loading || !ndaRecord) return null

  if (isOwner) {
    if (ndaRecord.access_status === 'pending') {
      return (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: '#fef9f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}><LockIcon size={14} /> Access request</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            This user signed the NDA and is requesting access to your private details.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (window.confirm('Grant this user access to your private details? This cannot be undone, and you will no longer be able to edit this listing once access is granted.')) {
                  respond(true)
                }
              }}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={13} color="#ffffff" /> Grant access
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => respond(false)} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><X size={13} color="currentColor" /> Deny</button>
          </div>
        </div>
      )
    }
    if (ndaRecord.access_status === 'denied') {
      return (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: '#fee2e2' }}>
          <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px' }}>
            <LockIcon size={13} color="#991b1b" /> You denied this user access to your private details.
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              if (window.confirm('Grant this user access to your private details? This cannot be undone, and you will no longer be able to edit this listing once access is granted.')) {
                respond(true)
              }
            }}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Check size={13} color="currentColor" /> Grant access instead
          </button>
        </div>
      )
    }
    if (ndaRecord.access_status === 'granted') {
      return (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: '#f0fdf4' }}>
          <div style={{ fontSize: '12px', color: '#166534' }}>
            <LockIcon size={13} color="#166534" /> You granted this user access to your private details. This cannot be undone.
          </div>
        </div>
      )
    }
    return null
  }

  if (ndaRecord.access_status === 'pending') {
    return (
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: 'var(--bg)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}><LockIcon size={13} color="var(--text-muted)" /> Waiting for seller approval to view private details.</div>
      </div>
    )
  }
  if (ndaRecord.access_status === 'denied') {
    return (
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: '#fee2e2' }}>
        <div style={{ fontSize: '12px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}><LockIcon size={13} color="#991b1b" /> The seller has not approved access to private details.</div>
      </div>
    )
  }
  return null
}
