export default function HowItWorks() {
  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '1.5rem' }}>How Chiron works</h1>

      <div className="card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>What Chiron is</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Chiron is a private marketplace where scientists, inventors, labs, and creators can connect with people who can bring their ideas to life — through funding, collaboration, or a direct exchange. Chiron facilitates these connections and provides tools like NDAs and dispute handling, but is not a party to any agreement made between users. The people involved are responsible for the terms of their own deals.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Trust badges</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '10px' }}>
          Every user has a trust score, built from real activity on the platform:
        </p>
        <ul style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.9, paddingLeft: '1.2rem' }}>
          <li>+3 points for each deal you complete</li>
          <li>+1–2 points for each positive review you receive</li>
          <li>+5 points for verifying an institutional email address (.edu, university domains, etc.)</li>
          <li>Points are deducted for disputes and reports, increasingly so if they happen repeatedly</li>
        </ul>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: '10px' }}>
          Your score determines your level — New, Trusted, or Verified — which also sets how many active deals you can run at once. This is a signal, not a guarantee: always use your own judgment before agreeing to a deal.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Reviews</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Once you complete at least one deal, you can leave and receive reviews. This requirement exists to keep reviews genuine — only people who have actually completed a transaction can rate each other. Reviews are public and appear on a user's profile.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>What to take care of</h2>
        <ul style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.9, paddingLeft: '1.2rem' }}>
          <li><strong>Use your real name.</strong> It builds trust and makes disputes far easier to resolve fairly.</li>
          <li><strong>Protect your idea before sharing it.</strong> Consider copyright, a patent, or keeping key details as a trade secret — whichever fits what you're offering.</li>
          <li><strong>An NDA is required before private details are shared</strong>, and access must be separately approved by the listing owner — but Chiron cannot guarantee an NDA's enforceability outside the platform.</li>
          <li><strong>Editing is locked once an NDA takes effect</strong>, to preserve an accurate record of what was actually disclosed.</li>
          <li><strong>Once an exchange is completed</strong>, ownership of the listing transfers, and a certificate is generated as a record — but this certificate does not itself constitute legal proof of IP transfer.</li>
          <li><strong>Disputes go through a 48-hour cooling-off period</strong> before a listing is freed again. Chiron does not arbitrate the underlying disagreement.</li>
        </ul>
      </div>
    </div>
  )
}
