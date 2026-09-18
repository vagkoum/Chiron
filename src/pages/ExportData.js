import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Download } from 'lucide-react'

export default function ExportData() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)

    const [listings, ndaAgreements, deals, reviews, ownershipHistory, messages] = await Promise.all([
      supabase.from('listings').select('*').eq('user_id', user.id),
      supabase.from('nda_agreements').select('*').or(`user_id.eq.${user.id},listing_owner_id.eq.${user.id}`),
      supabase.from('deals').select('*').or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase.from('reviews').select('*').or(`reviewer_id.eq.${user.id},reviewed_id.eq.${user.id}`),
      supabase.from('listing_ownership_history').select('*').or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`),
      supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      account_id: user.id,
      listings: listings.data || [],
      nda_agreements: ndaAgreements.data || [],
      deals: deals.data || [],
      reviews: reviews.data || [],
      ownership_history: ownershipHistory.data || [],
      messages: messages.data || [],
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chiron-data-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    setLoading(false)
  }

  return (
    <div className="page-narrow">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')} style={{ marginBottom: '1rem' }} title="Back to your profile">← Back to profile</button>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '1rem' }}>Export your data</h1>
      <div className="card">
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Download a copy of your listings, confidentiality agreements, deals, reviews, ownership history, and messages, as a single JSON file. This includes everything you've created or been party to on Chiron.
        </p>
        <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={15} color="#ffffff" /> {loading ? 'Preparing export…' : 'Download my data'}
        </button>
      </div>
    </div>
  )
}
