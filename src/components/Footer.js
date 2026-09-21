export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '1.5rem',
      marginTop: '3rem',
      textAlign: 'center',
      fontSize: '12px',
      color: 'var(--text-muted)'
    }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
        <a href="/terms" style={{ color: 'var(--text-muted)' }}>Terms of Use</a>
        <a href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a>
        <a href="/cookies" style={{ color: 'var(--text-muted)' }}>Cookie Policy</a>
      </div>
      <div>© {new Date().getFullYear()} Chiron. All rights reserved.</div>
    </footer>
  )
}
