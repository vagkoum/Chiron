import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import { AlertTriangle, Lightbulb, User, Building2 } from 'lucide-react'

export default function NewListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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
    language: TRADE_CONFIG.languages[0],
    target_country: TRADE_CONFIG.countries[0],
    target_audience: TRADE_CONFIG.audienceTypes[0],
  })

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
  e.preventDefault()
  if (!form.offer_title || !form.offer_description) {
    setError('Please fill in the required fields.')
    return
  }
  setLoading(true)
  setError('')

  const { private_details, ...publicFields } = form

  const { data: newListing, error: err } = await supabase.from('listings').insert({
  ...publicFields,
  user_id: user.id,
  active: true,
  has_private_details: !!(private_details && private_details.trim()),
}).select().single()

  if (err) { setError(err.message); setLoading(false); return }

  if (private_details && private_details.trim()) {
    const { error: pdErr } = await supabase.from('listing_private_details').insert({
      listing_id: newListing.id,
      private_details: private_details.trim(),
    })
    if (pdErr) { setError(pdErr.message); setLoading(false); return }
  }

  navigate('/browse')
}

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '0.5rem' }}>
        Submit your idea
      </h1>
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#92400e', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <AlertTriangle size={16} color="#92400e" style={{ flexShrink: 0, marginTop: '1px' }} /> <span><strong>Important:</strong> Do not reveal critical details in your public description. Share enough to attract interest — keep the key details for the private section below, which is only shown after a deal is agreed.</span>
      </div>
      <div style={{ background: '#e6f1fb', border: '1px solid #85B7EB', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#0c447c', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Lightbulb size={16} color="#0c447c" style={{ flexShrink: 0, marginTop: '1px' }} /> <span><strong>Tip:</strong> if your idea isn't protected yet, it's worth looking into copyright, a patent, or keeping key parts as a trade secret before sharing more widely — whichever fits what you're offering.</span>
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
                  {t === 'individual' ? (<><User size={13} style={{ verticalAlign: '-2px', marginRight: '3px' }} /> Individual / Researcher</>) : (<><Building2 size={13} style={{ verticalAlign: '-2px', marginRight: '3px' }} /> Company / Lab</>)}
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
            <span className="form-hint">Keep it intriguing but not too specific</span>
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
            <span className="form-hint">This is what everyone sees. Be compelling but protect your key details.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Private details <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 500 }}>🔒 ONLY REVEALED AFTER DEAL IS AGREED</span></label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '120px' }}
              placeholder="Here you can describe the full details of your idea, methodology, data, or creative work. This section is never shown publicly."
              value={form.private_details}
              onChange={e => update('private_details', e.target.value)}
            />
            <span className="form-hint">Optional but recommended. You control when and to whom this is revealed.</span>
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
            <span className="form-hint">Helps others find your submission</span>
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
              <label className="form-label">Language</label>
              <select className="form-select" value={form.language} onChange={e => update('language', e.target.value)}>
                {TRADE_CONFIG.languages.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target audience</label>
              <select className="form-select" value={form.target_audience} onChange={e => update('target_audience', e.target.value)}>
                {TRADE_CONFIG.audienceTypes.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Target country</label>
            <select className="form-select" value={form.target_country} onChange={e => update('target_country', e.target.value)}>
              {TRADE_CONFIG.countries.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Your location</label>
              <input
                className="form-input"
                placeholder="e.g. Athens, Greece or Remote"
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit idea'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  )
}
