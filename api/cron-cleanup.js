export default async function handler(req, res) {
  // Only allow Vercel's own cron system to trigger this, not the public internet
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/run_all_retention_cleanup`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!r.ok) {
      const text = await r.text()
      return res.status(500).json({ error: text })
    }

    return res.status(200).json({ success: true, ranAt: new Date().toISOString() })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
