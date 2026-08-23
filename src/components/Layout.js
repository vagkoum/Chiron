import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [pendingDeals, setPendingDeals] = useState(0)
 
    useEffect(() => {
    if (!user) return

    function loadUnread() {
      supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('read', false)
        .then(({ count }) => setUnread(count || 0))
    }

    function loadPendingRequests() {
      supabase
        .from('nda_agreements')
        .select('id', { count: 'exact' })
        .eq('listing_owner_id', user.id)
        .eq('access_status', 'pending')
        .then(({ count }) => setPendingRequests(count || 0))
    }

    function loadPendingDeals() {
      supabase
        .from('deals')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('status', 'proposed')
        .then(({ count }) => setPendingDeals(count || 0))
    }
      
    loadPendingDeals()
    window.addEventListener('deals-updated', loadPendingDeals)

    loadUnread()
    loadPendingRequests()
    window.addEventListener('messages-read', loadUnread)
    window.addEventListener('access-requests-updated', loadPendingRequests)
    return () => {
      window.removeEventListener('messages-read', loadUnread)
      window.removeEventListener('access-requests-updated', loadPendingRequests)
    }
  }, [user])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="nav-logo">
           <img src="/logo.png" alt="Chiron" style={{height: '52px', width: 'auto', objectFit: 'contain'}} />
          </NavLink>

          <NavLink to="/browse" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span>Browse</span>
          </NavLink>

          {user && (
            <>
              <NavLink to="/matches" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <span>Matches</span>
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <span>Messages</span>
                {unread > 0 && <span className="nav-badge">{unread}</span>}
              </NavLink>
              <NavLink to="/access-requests" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <span>Requests</span>
                {pendingRequests > 0 && <span className="nav-badge">{pendingRequests}</span>}
              </NavLink>
            </>
          )}

          {user ? (
            <>
              <button className="nav-post" onClick={() => navigate('/new-listing')}>
                + Post listing
              </button>
              <NavLink to="/profile">
                <button className="nav-avatar">{initials}</button>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link"><span>Log in</span></NavLink>
              <button className="nav-post" onClick={() => navigate('/register')}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}
