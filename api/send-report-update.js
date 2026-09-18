export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { reporterId, type, reason, status } = req.body

    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${reporterId}&select=email,full_name`,
      { headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
    )
    const data = await r.json()
    const reporter = data[0]
    if (!reporter?.email) return res.status(200).json({ error: 'No email found' })

    let subject, html
    if (type === 'received') {
      subject = 'We received your report — Chiron'
      html = `<p>Hi ${reporter.full_name || 'there'},</p><p>We've received your report regarding "${reason}". We'll review it and let you know the outcome.</p><p>— Chiron</p>`
    } else {
      subject = 'Update on your report — Chiron'
      const outcomeText = status === 'resolved'
        ? 'we reviewed your report and took appropriate action.'
        : 'after review, we did not find sufficient grounds to take action on your report.'
      html = `<p>Hi ${reporter.full_name || 'there'},</p><p>Regarding your report about "${reason}": ${outcomeText}</p><p>If you have further information, you're welcome to contact us at legal@chironevo.com.</p><p>— Chiron</p>`
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: 'noreply@chironevo.com', to: reporter.email, subject, html }),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(200).json({ error: String(err) })
  }
}
