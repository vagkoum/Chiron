export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { receiverId } = req.body

    // Get receiver email from Supabase
    const profileRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${receiverId}&select=email,full_name`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    )
    const profiles = await profileRes.json()
    const receiver = profiles[0]
    if (!receiver?.email) {
      return res.status(200).json({
        error: 'No email found',
        debug_status: profileRes.status,
        debug_body: profiles,
        debug_url_used: `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${receiverId}&select=email,full_name`
      })
    }

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@chironevo.com',
        to: receiver.email,
        subject: 'You have a new message on Chiron!',
        html: `<p>Hi ${receiver.full_name || 'there'},</p><p>You have a new message on Chiron. Log in to reply!</p><br/><a href="https://chironevo.com/messages">Click here to view your messages</a>`,
      }),
    })

    const result = await emailRes.json()
    return res.status(200).json({ success: true, result })

  } catch (err) {
    return res.status(200).json({ error: String(err) })
  }
}
