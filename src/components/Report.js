import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const REASONS = [
  'Scam or fraud attempt',
  'Fake listing',
  'Inappropriate content',
  'Harassment or abuse',
  'Spam',
  'Other',
]

export function ReportButton({ reportedUserId, listingId }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [goodFaith, setGoodFaith] = useState(false)

  if (!user || user.id === reportedUserId) return null

  async function handleSubmit() {
    if (!reason) { setError('Please select a reason.'); return }
    if (!goodFaith) { setError('Please confirm the statement below before submitting.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      listing_id: listingId || null,
      reason,
      details: details.trim(),
    })
    if (err) { setError(err.message); setLoading(false); return }

    fetch('/api/send-report-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId: user.id, type: 'received', reason })
    }).catch(e => console.error('Report receipt notification failed:', e))

    setLoading(false)
    setSubmitted(true)
    setTimeout(() => { setOpen(false); setSubmitted(false); setReason(''); setDetails(''); setGoodFaith(false) }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-faint)',
          fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
          padding: '4px 0'
        }}
      >
        🚩 Report this user
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: '14px', padding: '1.5rem',
              maxWidth: '400px', width: '100%'
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✓</div>
                <div style={{ fontWeight: 600 }}>Report submitted</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Our team will review it shortly.
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Report this user</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Help us keep the platform safe. Your report is confidential.
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select className="form-select" value={reason} onChange={e => setReason(e.target.value)}>
                    <option value="">Select a reason...</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional details (optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe what happened..."
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                  />
                </div>

                {error && <p className="form-error">{error}</p>}

                <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                  <button className="btn btn-danger btn-sm" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit report'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
