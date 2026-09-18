import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { CURRENT_TERMS_VERSION } from '../lib/legalConfig'

export default function TermsReacceptanceModal({ onAccepted }) {
  const { user, signOut } = useAuth()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    await supabase.from('profiles').update({
      terms_version: CURRENT_TERMS_VERSION,
      terms_accepted_at: new Date().toISOString(),
    }).eq('id', user.id)
    setLoading(false)
    onAccepted()
  }

  async function handleDecline() {
    await signOut()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '14px',
        maxWidth: '460px', width: '100%', padding: '1.75rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '12px' }}>Our Terms of Use have changed</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          We've updated our <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#0F6E56', fontWeight: 500 }}>Terms of Use</a>. Since these changes affect your rights or obligations as a user, you need to review and accept them again before continuing.
        </p>
        <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1.5rem' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }}
          />
          <span style={{ fontSize: '13px' }}>I have read and accept the updated Terms of Use.</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleAccept} disabled={!agreed || loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? 'Saving…' : 'Accept and continue'}
          </button>
          <button className="btn btn-outline" onClick={handleDecline}>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
