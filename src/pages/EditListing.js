import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { TRADE_CONFIG } from '../lib/tradeConfig'

export default function EditListing() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    offer_title: '',
    offer_description: '',
    private_details: '',
    seek_description: '',
    skills: '',
    category: TRADE_CONFIG.categories[0],
    availability: TRADE_CONFIG.availabilityOptions[0],
    location: '',
    user_type: 'individual',
    trade_type: 'both',
  })

    useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { navigate('/profile'); return }
        if (data.user_id !== user.id) { navigate('/profile'); return }

        if (data.status !== 'sold') {
          const { data: ndaRows } = await supabase
            .from('nda_agreements')
            .select('agreed_at')
            .eq('listing_id', id)
          const hasCurrentNda = (ndaRows || []).some(n => new Date(n.agreed_at) > new Date(data.owner_since))
          if (hasCurrentNda) { navigate('/profile'); return }
        }

        setForm(f => ({
          ...f,
          offer_title: data.offer_title || '',
          offer_description: data.offer_description || '',
          seek_description: data.seek_description || '',
          skills: data.skills || '',
          category: data.category || TRADE_CONFIG.categories[0],
          availability: data.availability || TRADE_CONFIG.availabilityOptions[0],
          location: data.location || '',
          user_type: data.user_type || 'individual',
          trade_type: data.trade_type || 'both',
        }))
      supabase
        .from('listing_private_details')
        .select('private_details')
        .eq('listing_id', id)
        .maybeSingle()
        .then(({ data: pd }) => {
          setForm(f => ({ ...f, private_details: pd?.private_details || '' }))
          setLoading(false)
        })
    })
}, [id, user])
  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
  e.preventDefault()
  if (!form.offer_title || !form.offer_description) {
    setError('Please fill in the required fields.')
    return
  }
  setSaving(true)
  setError('')

  const { private_details, ...publicFields } = form

  const { error: err } = await supabase
    .from('listings')
    .update({ ...publicFields, has_private_details: !!(private_details && private_details.trim()) })
    .eq('id', id)
    .eq('user_id', user.id)
  if (err) { setError(err.message); setSaving(false); return }

  const { error: pdErr } = await supabase
    .from('listing_private_details')
    .upsert({ listing_id: id, private_details: private_details || null }, { onConflict: 'listing_id' })
  if (pdErr) { setError(pdErr.message); setSaving(false); return }

  navigate('/profile')
}

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '0.5rem' }}>
        Edit your submission
      </h1>
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#92400e', marginBottom: '1.5rem' }}>
        ⚠️ <strong>Important:</strong> Do not reveal critical details in your public description. Keep key details in the private section.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          <div className="form-group">
            <label className="form-label">You are posting as</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['individual', 'business'].map(t => (
                <button
                  key={t} type="button"
                  className={`chip ${form.user_type === t ? 'active' : ''}`}
                  onClick={() => update('user_type', t)}
                >
                  {t === 'individual' ? '👤 Individual / Researcher' : '🏢 Company / Lab'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Novel water purification method using algae"
              value={form.offer_title}
              onChange={e => update('offer_title', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Public description * <span style={{ color: 'var(--green)', fontSize: '11px', fontWeight: 500 }}>VISIBLE TO ALL REGISTERED USERS</span></label>
            <textarea
              className="form-textarea"
              placeholder={TRADE_CONFIG.offerPlaceholder}
              value={form.offer_description}
              onChange={e => update('offer_description', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Private details <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 500 }}>🔒 ONLY REVEALED AFTER DEAL IS AGREED</span></label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '120px' }}
              placeholder="Full details of your idea, methodology, data, or creative work."
              value={form.private_details}
              onChange={e => update('private_details', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{TRADE_CONFIG.seekLabel}</label>
            <textarea
              className="form-textarea"
              placeholder={TRADE_CONFIG.seekPlaceholder}
              value={form.seek_description}
              onChange={e => update('seek_description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Keywords / tags</label>
            <input
              className="form-input"
              placeholder="e.g. biotechnology, water, sustainability (comma separated)"
              value={form.skills}
              onChange={e => update('skills', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => update('category', e.target.value)}>
                {TRADE_CONFIG.categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.availability} onChange={e => update('availability', e.target.value)}>
                {TRADE_CONFIG.availabilityOptions.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Country / Location</label>
              <input
                className="form-input"
                placeholder="e.g. Greece, Remote"
                value={form.location}
                onChange={e => update('location', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deal type</label>
              <select className="form-select" value={form.trade_type} onChange={e => update('trade_type', e.target.value)}>
                {TRADE_CONFIG.tradeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/profile')}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  )
}
