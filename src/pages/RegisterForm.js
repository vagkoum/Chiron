import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import { CURRENT_TERMS_VERSION } from '../lib/legalConfig'

export default function RegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [registered, setRegistered] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (!ageConfirmed) {
      setError('You must confirm you are at least 18 years old.')
      return
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Use to continue.')
      return
    }
    setLoading(true)
    try {
      const now = new Date().toISOString()
      await signUp(email, password, fullName, {
        age_confirmed_at: now,
        terms_accepted_at: now,
        terms_version: CURRENT_TERMS_VERSION,
      })
      setRegistered(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }
  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div className="auth-logo">{TRADE_CONFIG.platformName}</div>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '1rem auto'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '10px' }}>
            Check your email
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Didn't get it? Check your spam folder, or make sure the address is correct.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">{TRADE_CONFIG.platformName}</div>
        <h2 style={{ fontSize: '16px', fontWeight: 500, textAlign: 'center', marginBottom: '1.5rem' }}>
          Create your account (TEST FORM)
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div style={{ background: '#e6f1fb', border: '1px solid #85B7EB', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#0c447c', marginBottom: '1.5rem' }}>
            💡 <strong>We strongly recommend using your real name.</strong> It builds trust with the person you're negotiating with, makes disputes far easier to resolve fairly, and makes it much harder for someone to scam another user while hiding behind an anonymous name.
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={e => setAgeConfirmed(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px' }}>I confirm that I am at least 18 years old.</span>
          </label>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px' }}>
              I have read and accept the Terms of Use and Privacy Policy.
            </span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
