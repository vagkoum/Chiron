import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { canLeaveReview, updateTrustScore } from '../lib/trustScore'

function Stars({ value, onChange, readonly }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: readonly ? '16px' : '24px',
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color .1s'
          }}
        >★</span>
      ))}
    </div>
  )
}

export function ReviewForm({ reviewedId, listingId, onSubmitted }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [already, setAlready] = useState(false)
  const [canReview, setCanReview] = useState(null)
  const [checkingEligibility, setCheckingEligibility] = useState(true)

  useEffect(() => {
    if (!user) return

    // Check if already reviewed
    supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('reviewed_id', reviewedId)
      .single()
      .then(({ data }) => { if (data) setAlready(true) })

    // Check if eligible to review
    canLeaveReview(user.id).then(result => {
      setCanReview(result)
      setCheckingEligibility(false)
    })
  }, [user, reviewedId])

  async function handleSubmit() {
    if (!user) { setError('You must be logged in to leave a review.'); return }
    if (rating === 0) { setError('Please select a star rating.'); return }
    if (user.id === reviewedId) { setError("You can't review yourself."); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      listing_id: listingId,
      rating,
      comment: comment.trim(),
    })
    if (err) { setError(err.message); setLoading(false); return }

    // Update trust score of reviewed user
    await updateTrustScore(reviewedId, 'REVIEW_RECEIVED', { rating })

    setLoading(false)
    setAlready(true)
    if (onSubmitted) onSubmitted()
  }

  if (!user || user.id === reviewedId) return null
  if (checkingEligibility) return null
  if (already) return (
    <div style={{ background: 'var(--green-light)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--green-dark)', marginTop: '1rem' }}>
      ✓ You have already reviewed this user.
    </div>
  )

  if (!canReview?.allowed) return (
    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#92400e', marginTop: '1rem' }}>
      🔒 {canReview?.reason}
    </div>
  )

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '10px' }}>Leave a review</div>
      <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Your rating</div>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Your comment (optional)</div>
          <textarea
            className="form-textarea"
            style={{ width: '100%', minHeight: '70px' }}
            placeholder="Share your experience with this user..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || rating === 0}>
          {loading ? 'Submitting...' : 'Submit review'}
        </button>
      </div>
    </div>
  )
}

export function ReviewList({ reviewedId }) {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [avg, setAvg] = useState(0)

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('reviewed_id', reviewedId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const r = data || []
        setReviews(r)
        if (r.length > 0) setAvg((r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1))
        setLoading(false)
      })
  }, [reviewedId])

  if (loading) return null

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600, fontSize: '15px' }}>Reviews</div>
        {reviews.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: '14px', color: s <= Math.round(avg) ? '#f59e0b' : '#d1d5db' }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{avg}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No reviews yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reviews.map(r => (
            <div key={r.id} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div
                  style={{ fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${r.reviewer_id}`)}
                >
                  {r.profiles?.full_name || 'Anonymous'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '14px', color: s <= r.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {r.comment && <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.comment}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
