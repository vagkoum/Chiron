import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Favorites() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadFavorites()
    window.addEventListener('favorites-updated', loadFavorites)
    return () => window.removeEventListener('favorites-updated', loadFavorites)
  }, [user])

  async function loadFavorites() {
    const { data } = await supabase
      .from('favorites')
      .select('listing_id, listings(*, profiles!listings_user_id_fkey(full_name, company))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setListings((data || []).map(f => f.listings).filter(Boolean))
    setLoading(false)
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <h1 className="section-title" style={{ marginBottom: '1rem' }}>Your saved listings</h1>
      {listings.length === 0 ? (
        <div className="empty-state">
          <h3>No saved listings yet</h3>
          <p>Tap the heart on any listing to save it here.</p>
        </div>
      ) : (
        <div className="grid-listings">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}
