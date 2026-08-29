import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import ListingCard from '../components/ListingCard'
import SearchableSelect from '../components/SearchableSelect'
import { Search } from 'lucide-react'

export default function Browse() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [userType, setUserType] = useState('all')
  const [tradeType, setTradeType] = useState('all')
  const [language, setLanguage] = useState('all')
  const [targetCountry, setTargetCountry] = useState('Any')
  const [targetAudience, setTargetAudience] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [category, userType, tradeType, language, targetCountry, targetAudience])

  async function fetchListings() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('listings')
        .select('*, profiles!listings_user_id_fkey(full_name, company, avatar_url)')
        .eq('active', true)
        .neq('status', 'sold')
        .eq('removed', false)
        .order('created_at', { ascending: false })

      if (category !== 'all') query = query.eq('category', category)
      if (userType !== 'all') query = query.eq('user_type', userType)
      if (tradeType !== 'all') query = query.eq('trade_type', tradeType)
      if (language !== 'all') query = query.eq('language', language)
      if (targetCountry !== 'Any') query = query.eq('target_country', targetCountry)
      if (targetAudience !== 'all') query = query.eq('target_audience', targetAudience)

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
      l.profiles?.full_name?.toLowerCase().includes(q) ||
      l.language?.toLowerCase().includes(q) ||
      l.target_country?.toLowerCase().includes(q) ||
      l.target_audience?.toLowerCase().includes(q)
    )
  })

  const activeFilterCount = [
    category !== 'all', userType !== 'all', tradeType !== 'all',
    language !== 'all', targetCountry !== 'Any', targetAudience !== 'all'
  ].filter(Boolean).length

  function clearAllFilters() {
    setCategory('all'); setUserType('all'); setTradeType('all')
    setLanguage('all'); setTargetCountry('Any'); setTargetAudience('all')
  }

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

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', marginBottom: activeFilterCount > 0 ? '10px' : '1.5rem' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setFiltersOpen(o => !o)}
          style={{ whiteSpace: 'nowrap', height: '42px', padding: '0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="17" height="17" viewBox="-40 -40 80 80" fill="none" stroke="#0F6E56" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round">
            <path d="M-30 -30 L30 -30 L8 -5 L8 30 L-8 20 L-8 -5 Z" />
          </svg>
          Filters {activeFilterCount > 0 && <span className="nav-badge" style={{ marginLeft: '6px' }}>{activeFilterCount}</span>}
        </button>
        <div className="search-wrap" style={{ flex: 1, margin: 0, height: '42px' }}>
          <span className="search-icon" style={{ display: 'flex' }}><Search size={16} color="#0F6E56" /></span>
          <input
            type="text"
            placeholder="Search by title, skill, location, language, country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ height: '100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px' }}>×</button>
          )}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={clearAllFilters} style={{ color: 'var(--text-muted)' }}>
            Clear all filters
          </button>
        </div>
      )}

      {filtersOpen && (
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Posted by</div>
            <div className="filter-row" style={{ margin: 0 }}>
              <button className={`chip ${userType === 'all' ? 'active' : ''}`} onClick={() => setUserType('all')}>All</button>
              <button className={`chip ${userType === 'business' ? 'active' : ''}`} onClick={() => setUserType('business')}>Companies</button>
              <button className={`chip ${userType === 'individual' ? 'active' : ''}`} onClick={() => setUserType('individual')}>Individuals</button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Deal type</div>
            <div className="filter-row" style={{ margin: 0 }}>
              <button className={`chip ${tradeType === 'all' ? 'active' : ''}`} onClick={() => setTradeType('all')}>All</button>
              <button className={`chip ${tradeType === 'barter' ? 'active' : ''}`} onClick={() => setTradeType('barter')}>Barter only</button>
              <button className={`chip ${tradeType === 'paid' ? 'active' : ''}`} onClick={() => setTradeType('paid')}>Paid trades</button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Category</div>
            <div className="filter-row" style={{ margin: 0 }}>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Language</div>
              <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="all">Any language</option>
                {TRADE_CONFIG.languages.filter(l => l !== 'Not specified').map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Target audience</div>
              <select className="form-select" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
                <option value="all">Any audience</option>
                {TRADE_CONFIG.audienceTypes.filter(a => a !== 'Any').map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Target country</div>
            <SearchableSelect
              options={TRADE_CONFIG.countries}
              value={targetCountry}
              onChange={setTargetCountry}
              placeholder="Search countries…"
            />
          </div>
        </div>
      )}

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
