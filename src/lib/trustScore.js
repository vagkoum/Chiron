import { supabase } from './supabase'

// ─────────────────────────────────────────────
// TRUST SCORE CONFIGURATION
// ─────────────────────────────────────────────
export const TRUST_CONFIG = {
  // Points gained
  COMPLETED_DEAL: 3,
  REVIEW_5_STAR: 2,
  REVIEW_4_STAR: 1,
  VERIFIED_PRIVATE: 2,
  INSTITUTIONAL_EMAIL_BONUS: 5,

  // Points lost — disputes (escalating)
  DISPUTE_1_TO_3: -1,      // First 3 disputes
  DISPUTE_4_TO_6: -2,      // Next 3 disputes
  DISPUTE_7_PLUS: -4,      // Every dispute after 6

  // Points lost — reports received (delayed punishment)
  REPORT_FIRST: 0,         // First report — no penalty
  REPORT_SECOND: -1,       // Second report
  REPORT_THIRD_PLUS: -3,   // Third+ report

  // Level thresholds
  LEVELS: {
    new: { min: 0, max: 9, label: 'New', icon: '🥉', maxDeals: 2 },
    trusted: { min: 10, max: 29, label: 'Trusted', icon: '🥈', maxDeals: 5 },
    verified: { min: 30, max: Infinity, label: 'Verified', icon: '🥇', maxDeals: 10 },
  },

  // Auto-flag threshold
  FLAG_THRESHOLD: -10,

  // Institutional email domains (partial list — expand as needed)
  INSTITUTIONAL_DOMAINS: [
    '.edu', '.ac.uk', '.ac.gr', '.edu.gr', '.gov', '.gov.gr',
    'mit.edu', 'harvard.edu', 'stanford.edu', 'ox.ac.uk', 'cam.ac.uk',
    'uoa.gr', 'auth.gr', 'ntua.gr', 'upatras.gr'
  ],
}

// ─────────────────────────────────────────────
// GET OR CREATE TRUST SCORE FOR A USER
// ─────────────────────────────────────────────
export async function getOrCreateTrustScore(userId) {
  const { data: existing } = await supabase
    .from('trust_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  const { data: newScore } = await supabase
    .from('trust_scores')
    .insert({ user_id: userId, score: 0, level: 'new' })
    .select()
    .single()

  return newScore
}

// ─────────────────────────────────────────────
// CALCULATE LEVEL FROM SCORE
// ─────────────────────────────────────────────
export function calculateLevel(score) {
  if (score >= 30) return 'verified'
  if (score >= 10) return 'trusted'
  return 'new'
}

export function getLevelInfo(level) {
  return TRUST_CONFIG.LEVELS[level] || TRUST_CONFIG.LEVELS.new
}

// ─────────────────────────────────────────────
// CHECK IF INSTITUTIONAL EMAIL
// ─────────────────────────────────────────────
export function isInstitutionalEmail(email) {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase() || ''
  return TRUST_CONFIG.INSTITUTIONAL_DOMAINS.some(d => domain.endsWith(d))
}

// ─────────────────────────────────────────────
// UPDATE TRUST SCORE
// ─────────────────────────────────────────────
export async function updateTrustScore(userId, event, metadata = {}) {
  const current = await getOrCreateTrustScore(userId)
  if (!current) return

  let pointChange = 0
  let updates = {}

  switch (event) {
    case 'DEAL_COMPLETED':
      pointChange = TRUST_CONFIG.COMPLETED_DEAL
      updates.completed_deals = (current.completed_deals || 0) + 1
      updates.active_deals = Math.max(0, (current.active_deals || 0) - 1)
      break

    case 'DEAL_STARTED':
      updates.active_deals = (current.active_deals || 0) + 1
      break

    case 'DEAL_ENDED':
      updates.active_deals = Math.max(0, (current.active_deals || 0) - 1)
      break

    case 'DISPUTE_INITIATED': {
      const disputeCount = (current.disputed_deals || 0) + 1
      if (disputeCount <= 3) pointChange = TRUST_CONFIG.DISPUTE_1_TO_3
      else if (disputeCount <= 6) pointChange = TRUST_CONFIG.DISPUTE_4_TO_6
      else pointChange = TRUST_CONFIG.DISPUTE_7_PLUS
      updates.disputed_deals = disputeCount
      updates.active_deals = Math.max(0, (current.active_deals || 0) - 1)
      break
    }

    case 'REPORT_RECEIVED': {
      const reportCount = (current.reports_received || 0) + 1
      if (reportCount === 1) pointChange = TRUST_CONFIG.REPORT_FIRST
      else if (reportCount === 2) pointChange = TRUST_CONFIG.REPORT_SECOND
      else pointChange = TRUST_CONFIG.REPORT_THIRD_PLUS
      updates.reports_received = reportCount
      break
    }

    case 'REVIEW_RECEIVED':
      if (metadata.rating === 5) pointChange = TRUST_CONFIG.REVIEW_5_STAR
      else if (metadata.rating === 4) pointChange = TRUST_CONFIG.REVIEW_4_STAR
      break

    case 'INSTITUTIONAL_EMAIL':
      pointChange = TRUST_CONFIG.INSTITUTIONAL_EMAIL_BONUS
      break

    case 'VERIFIED_PRIVATE':
      pointChange = TRUST_CONFIG.VERIFIED_PRIVATE
      break

    default:
      break
  }

  const newScore = (current.score || 0) + pointChange
  const newLevel = calculateLevel(newScore)
  const shouldFlag = newScore <= TRUST_CONFIG.FLAG_THRESHOLD

  const { data } = await supabase
    .from('trust_scores')
    .update({
      score: newScore,
      level: newLevel,
      flagged: shouldFlag,
      updated_at: new Date().toISOString(),
      ...updates,
    })
    .eq('user_id', userId)
    .select()
    .single()

  return data
}

// ─────────────────────────────────────────────
// CHECK IF USER CAN START A NEW DEAL
// ─────────────────────────────────────────────
export async function canStartDeal(userId) {
  const trustScore = await getOrCreateTrustScore(userId)
  if (!trustScore) return { allowed: true, reason: '' }

  const levelInfo = getLevelInfo(trustScore.level)
  const activeDeals = trustScore.active_deals || 0

  if (activeDeals >= levelInfo.maxDeals) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${levelInfo.maxDeals} active deal${levelInfo.maxDeals !== 1 ? 's' : ''} for your trust level (${levelInfo.icon} ${levelInfo.label}). Complete or close existing deals to start new ones.`
    }
  }

  return { allowed: true, reason: '' }
}

// ─────────────────────────────────────────────
// CHECK IF USER CAN LEAVE A REVIEW
// ─────────────────────────────────────────────
export async function canLeaveReview(userId) {
  const trustScore = await getOrCreateTrustScore(userId)
  if (!trustScore) return { allowed: false, reason: 'Could not verify your account.' }

  if ((trustScore.completed_deals || 0) < 1) {
    return {
      allowed: false,
      reason: 'You need to complete at least 1 deal before you can leave reviews. This helps us prevent fake reviews.'
    }
  }

  return { allowed: true, reason: '' }
}

// ─────────────────────────────────────────────
// CHECK FOR DUPLICATE IP (flag suspicious accounts)
// ─────────────────────────────────────────────
export async function checkDuplicateIP(ip, userId) {
  if (!ip) return

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('signup_ip', ip)
    .neq('id', userId)

  if (existing && existing.length >= 2) {
    // Flag this user in trust scores
    await supabase
      .from('trust_scores')
      .update({ flagged: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  }
}
