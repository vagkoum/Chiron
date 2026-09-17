export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { discloserId, recipientId, listingId } = req.body

    async function fetchProfile(id) {
      const r = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=email,full_name`,
        { headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
      )
      const data = await r.json()
      return data[0]
    }

    async function fetchListing(id) {
      const r = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/listings?id=eq.${id}&select=offer_title`,
        { headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
      )
      const data = await r.json()
      return data[0]
    }

    const [discloser, recipient, listing] = await Promise.all([
      fetchProfile(discloserId),
      fetchProfile(recipientId),
      fetchListing(listingId),
    ])

    const html = `
      <p>Hi,</p>
      <p>A Confidentiality Agreement has just been recorded on Chiron between <strong>${discloser?.full_name || '—'}</strong> and <strong>${recipient?.full_name || '—'}</strong>, regarding the listing "<strong>${listing?.offer_title || '—'}</strong>".</p>
      <p>A full copy was shown to both parties at the moment of signing. If you need it again, please contact us at legal@chironevo.com with the listing name and approximate date, and we will retrieve the record for you.</p>
      <p>— Chiron</p>
    `

    async function sendTo(email) {
      if (!email) return
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'noreply@chironevo.com',
          to: email,
          subject: 'Confidentiality Agreement recorded on Chiron',
          html,
        }),
      })
    }

    await Promise.all([sendTo(discloser?.email), sendTo(recipient?.email)])

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(200).json({ error: String(err) })
  }
}
