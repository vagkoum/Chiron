import { Link } from 'react-router-dom'
import { TRADE_CONFIG } from '../lib/tradeConfig'

export default function Register() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          {TRADE_CONFIG.platformName}
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 500, textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          Sign-ups temporarily paused
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          We're currently preparing for launch. New registrations will open soon — thanks for your patience!
        </p>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
