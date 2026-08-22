import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import ListingCard from '../components/ListingCard'

export default function Browse() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [userType, setUserType] = useState('all')
  const [tradeType, setTradeType] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [category, userType, tradeType])

    async function fetchListings() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('listings')
        .select('*, profiles!listings_user_id_fkey(full_name, company)')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (category !== 'all') query = query.eq('category', category)
      if (userType !== 'all') query = query.eq('user_type', userType)
      if (tradeType !== 'all') query = query.eq('trade_type', tradeType)

      const { data, error: queryError } = await query

      if (queryError) {
        setError(queryError.message)
        setListings([])
      } else {
        const ids = (data || []).map(l => l.id)
        const negotiating = new Set()
        if (ids.length > 0) {
          const { data: dealsData } = await supabase
            .from('deals')
            .select('listing_id')
            .in('listing_id', ids)
            .in('status', ['proposed', 'accepted'])
          dealsData?.forEach(d => negotiating.add(d.listing_id))
        }
        setListings((data || []).map(l => ({ ...l, underNegotiation: negotiating.has(l.id) })))
      }
    } catch (err) {
      setError(err.message)
      setListings([])
    }
    setLoading(false)
  }

  const filtered = listings.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.offer_title?.toLowerCase().includes(q) ||
      l.offer_description?.toLowerCase().includes(q) ||
      l.skills?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.profiles?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page">
      <div className="section-header">
        <h1 className="section-title" style={{ fontSize: '20px' }}>
          Browse {TRADE_CONFIG.listingNamePlural}
        </h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by title, skill, location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px' }}>×</button>
        )}
      </div>

      <div className="filter-row">
        <button className={`chip ${userType === 'all' ? 'active' : ''}`} onClick={() => setUserType('all')}>All</button>
        <button className={`chip ${userType === 'business' ? 'active' : ''}`} onClick={() => setUserType('business')}>Companies</button>
        <button className={`chip ${userType === 'individual' ? 'active' : ''}`} onClick={() => setUserType('individual')}>Individuals</button>
        <span style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
        <button className={`chip ${tradeType === 'barter' ? 'active' : ''}`} onClick={() => setTradeType(tradeType === 'barter' ? 'all' : 'barter')}>Barter only</button>
        <button className={`chip ${tradeType === 'paid' ? 'active' : ''}`} onClick={() => setTradeType(tradeType === 'paid' ? 'all' : 'paid')}>Paid trades</button>
      </div>

      <div className="filter-row">
        {['all', ...TRADE_CONFIG.categories].map(cat => (
          <button
            key={cat}
            className={`chip ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? 'All categories' : cat}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '1rem', fontSize: '13px', color: '#991b1b' }}>
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No listings found</h3>
          <p>Total fetched: {listings.length}</p>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid-listings">
          {filtered.map(l => {
            try {
              return <ListingCard key={l.id} listing={l} />
            } catch (err) {
              return (
                <div key={l.id} className="card">
                  <div style={{ fontWeight: 500 }}>{l.offer_title}</div>
                  <div style={{ fontSize: '12px', color: 'red' }}>Card error: {err.message}</div>
                </div>
              )
            }
          })}
        </div>
      )}
    </div>
  )
}
