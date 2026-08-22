import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', company: '', bio: '', location: '' })
  const [listings, setListings] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
  if (profile) setForm({ full_name: profile.full_name || '', company: profile.company || '', bio: profile.bio || '', location: profile.location || '' })

  async function loadListings() {
    const { data: listingsData } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const ids = (listingsData || []).map(l => l.id)
    const blocked = new Set()

    if (ids.length > 0) {
      const { data: dealsData } = await supabase
        .from('deals')
        .select('listing_id, status')
        .in('listing_id', ids)
        .in('status', ['proposed', 'accepted', 'disputed', 'completed'])
      dealsData?.forEach(d => blocked.add(d.listing_id))

      const { data: ndaData } = await supabase
        .from('nda_agreements')
        .select('listing_id, access_status')
        .in('listing_id', ids)
        .eq('access_status', 'granted')
      ndaData?.forEach(n => blocked.add(n.listing_id))
    }

    setListings((listingsData || []).map(l => ({ ...l, canDelete: !blocked.has(l.id) })))
  }

  loadListings()
  window.addEventListener('listings-updated', loadListings)
  return () => window.removeEventListener('listings-updated', loadListings)
}, [profile, user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function toggleListing(id, active) {
    await supabase.from('listings').update({ active: !active }).eq('id', id)
    setListings(ls => ls.map(l => l.id === id ? { ...l, active: !active } : l))
  }

  async function deleteListing(id) {
    if (!window.confirm('Delete this listing?')) return
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (!error) {
      setListings(ls => ls.filter(l => l.id !== id))
      window.dispatchEvent(new Event('listings-updated'))
    }
  }
  async function handleSignOut() {
    await signOut()
    navigate('/')
  }
async function handleDeleteAccount() {
    if (!window.confirm('Are you sure you want to delete your account? This will permanently delete all your data, listings, messages and reviews. This cannot be undone.')) return
    if (!window.confirm('This is your final confirmation. Your account and all associated data will be permanently deleted. Are you absolutely sure?')) return
    
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) {
      alert('Something went wrong. Please contact us at legal@chironevo.com')
      return
    }
    await signOut()
    navigate('/')
  }
  const initials = form.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '1.5rem' }}>Your profile</h1>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="avatar avatar-lg">{initials}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{form.full_name || 'Your name'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Company (optional)</label>
            <input className="form-input" placeholder="Leave blank if individual" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" placeholder="e.g. Athens, Greece" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Short bio</label>
            <textarea className="form-textarea" placeholder="Tell others a bit about yourself or your company…" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="section-header">
        <h2 className="section-title">Your listings</h2>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/new-listing')}>+ New listing</button>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <h3>No listings yet</h3>
          <p>Post your first listing to start trading.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
          {listings.map(l => (
            <div key={l.id} className="card" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{l.offer_title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.category} · {l.availability}</div>
              </div>
              <span className={`pill ${l.active ? 'pill-green' : 'pill-gray'}`}>{l.active ? 'Active' : 'Paused'}</span>
             <button className="btn btn-outline btn-sm" onClick={() => navigate(`/edit-listing/${l.id}`)}>
              Edit
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => toggleListing(l.id, l.active)}>
              {l.active ? 'Pause' : 'Activate'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteListing(l.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <hr className="divider" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn btn-outline btn-sm" onClick={handleSignOut} style={{ color: 'var(--text-muted)' }}>
          Sign out
        </button>
        <hr className="divider" />
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Danger zone</div>
        <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>
          🗑 Delete my account permanently
        </button>
        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
          This will permanently delete your account, listings, messages and reviews. This cannot be undone.
        </div>
      </div>
    </div>
  )
}
