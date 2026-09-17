export default function RealNameWarningModal({ onContinueAnyway, onGoFixName }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '14px',
        maxWidth: '420px', width: '100%', padding: '1.75rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Use your real name</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '10px' }}>
          You are about to accept a confidentiality agreement with another user. It is a contract between the two of you, and Chiron is not a party to it.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '10px' }}>
          If you enter a username instead of your real name, that agreement will be very difficult to enforce, by you or against you.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          The name you enter is shown to the other user before they decide whether to grant access. Many users will refuse a request that does not carry a real name.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-primary" onClick={onGoFixName} style={{ justifyContent: 'center' }}>
            Continue with my full name
          </button>
          <button className="btn btn-outline" onClick={onContinueAnyway} style={{ justifyContent: 'center' }}>
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  )
}
