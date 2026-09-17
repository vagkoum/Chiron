import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { openNdaRecord } from '../lib/ndaRecord'
import { FileText } from 'lucide-react'

export default function MyAgreements() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [agreements, setAgreements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('nda_agreements')
        .select(`
          id, agreed_at, agreement_version, user_id, listing_owner_id,
          listing:listings(offer_title),
          recipient:profiles!nda_agreements_user_id_fkey(full_name),
          owner:profiles!nda_agreements_listing_owner_id_fkey(full_name)
        `)
        .or(`user_id.eq.${user.id},listing_owner_id.eq.${user.id}`)
        .order('agreed_at', { ascending: false })
      setAgreements(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  function viewDocument(a) {
    const isRecipient = a.user_id === user.id
    openNdaRecord({
      discloserName: a.owner?.full_name || '—',
      recipientName: a.recipient?.full_name || '—',
      listingTitle: a.listing?.offer_title || '—',
      acceptedAt: a.agreed_at,
      agreementVersion: a.agreement_version || 'v1',
    })
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page-narrow">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')} style={{ marginBottom: '1rem' }} title="Back to your profile">← Back to profile</button>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '1.5rem' }}>Your confidentiality agreements</h1>

      {agreements.length === 0 ? (
        <div className="empty-state">
          <h3>No agreements yet</h3>
          <p>Agreements you've signed or received will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {agreements.map(a => {
            const isRecipient = a.user_id === user.id
            return (
              <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{a.listing?.offer_title || '—'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isRecipient ? `You signed with ${a.owner?.full_name || '—'}` : `${a.recipient?.full_name || '—'} signed with you`}
                    {' · '}{new Date(a.agreed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => viewDocument(a)} title="View this agreement" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={13} color="#0F6E56" /> View
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
