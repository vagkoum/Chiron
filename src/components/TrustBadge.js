import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getLevelInfo } from '../lib/trustScore'

export function TrustBadge({ userId, showDetails = false }) {
  const [trustScore, setTrustScore] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) { setLoaded(true); return }
    supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setTrustScore(data || { level: 'new', score: 0, completed_deals: 0, active_deals: 0 })
        setLoaded(true)
      })
  }, [userId])

  if (!loaded) return null
  if (!trustScore) return null

  const levelInfo = getLevelInfo(trustScore.level || 'new')

  if (!showDetails) {
    return (
      <span style={{
        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
        background: trustScore.level === 'verified' ? '#E1F5EE' : trustScore.level === 'trusted' ? '#e6f1fb' : '#f0efe8',
        color: trustScore.level === 'verified' ? '#0F6E56' : trustScore.level === 'trusted' ? '#0c447c' : '#6b6b6b',
        fontWeight: 500, whiteSpace: 'nowrap'
      }}>
        {levelInfo.icon} {levelInfo.label}
      </span>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '24px' }}>{levelInfo.icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{levelInfo.label} user</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trust score: {trustScore.score || 0} points</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', padding: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--green)' }}>{trustScore.completed_deals || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed deals</div>
        </div>
        <div style={{ textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', padding: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--green)' }}>{trustScore.active_deals || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active deals</div>
        </div>
        <div style={{ textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', padding: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: levelInfo.maxDeals > (trustScore.active_deals || 0) ? 'var(--green)' : '#dc2626' }}>
            {levelInfo.maxDeals - (trustScore.active_deals || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deal slots left</div>
        </div>
      </div>
      {trustScore.level !== 'verified' && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
          {trustScore.level === 'new'
            ? `${10 - (trustScore.score || 0)} more points to reach 🥈 Trusted (5 active deals)`
            : `${30 - (trustScore.score || 0)} more points to reach 🥇 Verified (10 active deals)`
          }
        </div>
      )}
    </div>
  )
}
