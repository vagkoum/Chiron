import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { TRADE_CONFIG } from '../lib/tradeConfig'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, MessageCircle, Bell, Plus } from 'lucide-react'

function MatchesIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="-25 -25 50 50" style={{ marginRight: '4px', verticalAlign: '-3px' }}>
      <circle cx="-6" cy="0" r="10" fill="none" stroke="#0F6E56" strokeWidth="2.2" />
      <circle cx="6" cy="0" r="10" fill="none" stroke="#0F6E56" strokeWidth="2.2" />
    </svg>
  )
}

function DealsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="-30 -30 60 60" style={{ marginRight: '4px', verticalAlign: '-3px' }}>
      <line x1="-26" y1="-10" x2="18" y2="-10" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 -20 l10 10 l-10 10" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="26" y1="10" x2="-18" y2="10" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" />
      <path d="M-8 20 l-10 -10 l10 -10" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
        .select('id, proposer_id, receiver_id, proposer_confirmed, receiver_confirmed, status')
        .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .in('status', ['proposed', 'accepted'])
        .then(({ data }) => {
          const count = (data || []).filter(d => {
            if (d.status === 'proposed') return d.receiver_id === user.id
            if (d.status === 'accepted') {
              const isProposer = d.proposer_id === user.id
              const myConfirmed = isProposer ? d.proposer_confirmed : d.receiver_confirmed
              const otherConfirmed = isProposer ? d.receiver_confirmed : d.proposer_confirmed
              // only notify me if the OTHER side already confirmed and it's now on me
              return otherConfirmed && !myConfirmed
            }
            return false
          }).length
          setPendingDeals(count)
        })
    }
      
    loadPendingDeals()
    window.addEventListener('deals-updated', loadPendingDeals)

    loadUnread()
    loadPendingRequests()
    loadPendingDeals()
    window.addEventListener('messages-read', loadUnread)
    window.addEventListener('access-requests-updated', loadPendingRequests)
    window.addEventListener('deals-updated', loadPendingDeals)
    return () => {
      window.removeEventListener('messages-read', loadUnread)
      window.removeEventListener('access-requests-updated', loadPendingRequests)
      window.removeEventListener('deals-updated', loadPendingDeals)
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
            <Search size={16} style={{ marginRight: '4px', verticalAlign: '-3px' }} />
            <span>Browse</span>
          </NavLink>

          {user && (
            <>
              <NavLink to="/matches" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <MatchesIcon />
                <span>Matches</span>
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <MessageCircle size={16} style={{ marginRight: '4px', verticalAlign: '-3px' }} />
                <span>Messages</span>
                {unread > 0 && <span className="nav-badge">{unread}</span>}
              </NavLink>
              <NavLink to="/access-requests" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <Bell size={16} style={{ marginRight: '4px', verticalAlign: '-3px' }} />
                <span>Requests</span>
                {pendingRequests > 0 && <span className="nav-badge">{pendingRequests}</span>}
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                <DealsIcon />
                <span>Deals</span>
                {pendingDeals > 0 && <span className="nav-badge">{pendingDeals}</span>}
             </NavLink>
             <NavLink to="/favorites" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
               <svg width="17" height="17" viewBox="-40 -40 80 80" style={{ marginRight: '4px', verticalAlign: '-3px' }}>
                 <path
                   d="M0 35 C-18 20, -32 5, -32 -10 C-32 -22, -22 -30, -12 -27 C-6 -25, -1 -19, 0 -14 C1 -19, 6 -25, 12 -27 C22 -30, 32 -22, 32 -10 C32 5, 18 20, 0 35 Z"
                   fill="#dc2626"
                   stroke="#000000"
                   strokeWidth="4"
                   strokeLinejoin="round"
                 />
               </svg>
               <span>Favorites</span>
             </NavLink>
            </>
          )}

          {user ? (
            <>
              <button className="nav-post" onClick={() => navigate('/new-listing')}>
                + Post listing
              </button>
              <NavLink to="/profile">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <button className="nav-avatar">{initials}</button>
                )}
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
