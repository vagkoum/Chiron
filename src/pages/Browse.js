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

  useEffect(() => {
    fetchListings()
  }, [category, userType, tradeType])

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, profiles(full_name, company)')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (category !== 'all') query = query.eq('category', category)
    if (userType !== 'all') query = query.eq('user_type', userType)
    if (tradeType !== 'all') query = query.eq('trade_type', tradeType)

    const { data } = await query
    setListings(data || [])
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
          placeholder={`Search by role, skill, location…`}
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

      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No listings found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid-listings">
          {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}
