import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Check, X } from 'lucide-react'

export default function AccessRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null)

  useEffect(() => { loadRequests() }, [user])

  async function loadRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('nda_agreements')
      .select(`id, agreed_at, access_status, listing_id, user_id,
        listing:listings(offer_title),
        requester:profiles!nda_agreements_user_id_fkey(full_name, company)`)
      .eq('listing_owner_id', user.id)
      .eq('access_status', 'pending')
      .order('agreed_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function respond(id, grant) {
    setSubmitting(id)
    await supabase
      .from('nda_agreements')
      .update({ access_status: grant ? 'granted' : 'denied', access_decided_at: new Date().toISOString() })
      .eq('id', id)
    setRequests(r => r.filter(req => req.id !== id))
    setSubmitting(null)
    window.dispatchEvent(new Event('access-requests-updated'))
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '1rem' }}>
        Pending access requests
      </h1>

      {requests.length === 0 ? (
        <div className="empty-state">
          <h3>No pending requests</h3>
          <p>When someone signs an NDA on your listings, their request to view private details will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.map(r => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.requester?.full_name || 'User'}</div>
                  {r.requester?.company && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.requester.company}</div>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {new Date(r.agreed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div
                style={{ fontSize: '13px', color: 'var(--green-dark)', marginBottom: '10px', cursor: 'pointer' }}
                onClick={() => navigate(`/listing/${r.listing_id}`)}
                title="View this listing"
              >
                re: {r.listing?.offer_title}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => respond(r.id, true)} disabled={submitting === r.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Approve this user's access to your private details">
                  <Check size={13} color="#ffffff" /> Grant access
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => respond(r.id, false)} disabled={submitting === r.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <X size={13} color="currentColor" /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
