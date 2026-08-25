import { TrustBadge } from '../components/TrustBadge'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const ADMIN_ID = '60c0540e-5c06-4204-b0ec-f216905d0754'

export default function Admin() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState({ users: 0, listings: 0, messages: 0, threads: 0, reports: 0 })
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [reports, setReports] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.id !== ADMIN_ID)) {
      navigate('/')
    }
  }, [user, loading])

  useEffect(() => {
    if (user?.id === ADMIN_ID) loadAll()
  }, [user])

  async function loadAll() {
    setLoadingData(true)

    const [
      { count: userCount },
      { count: listingCount },
      { count: messageCount },
      { count: threadCount },
      { count: reportCount },
      { data: usersData },
      { data: listingsData },
      { data: reportsData },
      { data: disputesData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('message_threads').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*, profiles!listings_user_id_fkey(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('deals').select('*, proposer:profiles!deals_proposer_id_fkey(full_name), receiver:profiles!deals_receiver_id_fkey(full_name), listing:listings(offer_title)').eq('status', 'disputed').order('updated_at', { ascending: false }),
    ])

    setStats({
      users: userCount || 0,
      listings: listingCount || 0,
      messages: messageCount || 0,
      threads: threadCount || 0,
      reports: reportCount || 0,
    })
    setUsers(usersData || [])
    setListings(listingsData || [])
    setDisputes(disputesData || [])
    setReports(reportsData || [])
    setLoadingData(false)
  }

  async function toggleBanUser(id, banned) {
    const verb = banned ? 'unban' : 'ban'
    if (!window.confirm(`Are you sure you want to ${verb} this user? Their deals, NDAs, and exchange history are preserved either way.`)) return
    await supabase.from('profiles').update({ banned: !banned }).eq('id', id)
    setUsers(us => us.map(u => u.id === id ? { ...u, banned: !banned } : u))
  }

  async function toggleRemoveListing(id, removed) {
    const verb = removed ? 'restore' : 'remove'
    if (!window.confirm(`Are you sure you want to ${verb} this listing? Deals and history are preserved either way.`)) return
    await supabase.from('listings').update({ removed: !removed }).eq('id', id)
    setListings(ls => ls.map(l => l.id === id ? { ...l, removed: !removed } : l))
  }
  
  async function resolveReport(id, status) {
    await supabase.from('reports').update({ status }).eq('id', id)
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r))
  }

  async function toggleListing(id, active) {
    await supabase.from('listings').update({ active: !active }).eq('id', id)
    setListings(ls => ls.map(l => l.id === id ? { ...l, active: !active } : l))
  }

  if (loading || loadingData) return (
    <div className="loading-screen"><div className="spinner" /></div>
  )

  if (!user || user.id !== ADMIN_ID) return null

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Admin Panel</h1>
        <span className="pill pill-green">You only can see this</span>
      </div>

      {/* Tabs */}
      <div className="filter-row" style={{ marginBottom: '1.5rem' }}>
        {['stats', 'users', 'listings', 'reports', 'disputes'].map(t => (
          <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'stats' ? '📊 Statistics' : t === 'users' ? '👥 Users' : t === 'listings' ? '📋 Listings' : t === 'reports' ? `🚩 Reports${stats.reports > 0 ? ` (${stats.reports})` : ''}` : `⚠️ Disputes${disputes.length > 0 ? ` (${disputes.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && (
        <>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            <div className="stat-card"><div className="stat-num">{stats.users}</div><div className="stat-lbl">Total users</div></div>
            <div className="stat-card"><div className="stat-num">{stats.listings}</div><div className="stat-lbl">Total listings</div></div>
            <div className="stat-card"><div className="stat-num">{stats.threads}</div><div className="stat-lbl">Conversations</div></div>
            <div className="stat-card"><div className="stat-num">{stats.messages}</div><div className="stat-lbl">Messages sent</div></div>
            <div className="stat-card"><div className="stat-num" style={{ color: stats.reports > 0 ? '#dc2626' : 'var(--green)' }}>{stats.reports}</div><div className="stat-lbl">Pending reports</div></div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Platform health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active listings</span>
                <span style={{ fontWeight: 500 }}>{listings.filter(l => l.active).length} / {listings.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Users with listings</span>
                <span style={{ fontWeight: 500 }}>{new Set(listings.map(l => l.user_id)).size}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Avg messages per conversation</span>
                <span style={{ fontWeight: 500 }}>{stats.threads > 0 ? (stats.messages / stats.threads).toFixed(1) : 0}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Email</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Company</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Location</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Joined</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 14px' }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{u.email || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{u.company || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{u.location || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                    {u.banned && <span className="pill" style={{ background: '#fee2e2', color: '#991b1b', marginLeft: '6px' }}>Banned</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <TrustBadge userId={u.id} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {u.id !== ADMIN_ID ? (
                      <button
                        className={u.banned ? 'btn btn-outline btn-sm' : 'btn btn-danger btn-sm'}
                        onClick={() => toggleBanUser(u.id, u.banned)}
                      >
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="empty-state"><h3>No users yet</h3></div>
          )}
        </div>
      )}

      {/* LISTINGS */}
      {tab === 'listings' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Title</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Posted by</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Trust</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < listings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.offer_title}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{l.profiles?.full_name || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{l.category}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`pill ${l.user_type === 'business' ? 'pill-blue' : 'pill-purple'}`}>
                      {l.user_type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`pill ${l.active ? 'pill-green' : 'pill-gray'}`}>
                      {l.active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 14px', display: 'flex', gap: '6px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleListing(l.id, l.active)}>
                      {l.active ? 'Pause' : 'Activate'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteListing(l.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 && (
            <div className="empty-state"><h3>No listings yet</h3></div>
          )}
        </div>
      )}
      {/* REPORTS */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reports.length === 0 && (
            <div className="empty-state"><h3>No reports</h3><p>Your platform is clean!</p></div>
          )}
          {reports.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: r.status === 'pending' ? '3px solid #dc2626' : '3px solid var(--green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.reason}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Reported by {r.reporter?.full_name || 'Unknown'} → against {r.reported?.full_name || 'Unknown'}
                  </div>
                </div>
                <span className={`pill ${r.status === 'pending' ? 'pill-amber' : 'pill-green'}`}>{r.status}</span>
              </div>
              {r.details && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', background: 'var(--bg)', padding: '8px 10px', borderRadius: '6px' }}>{r.details}</div>}
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '8px' }}>{new Date(r.created_at).toLocaleString()}</div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => resolveReport(r.id, 'resolved')}>Mark resolved</button>
                  <button className="btn btn-outline btn-sm" onClick={() => resolveReport(r.id, 'dismissed')}>Dismiss</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser(r.reported_user_id)}>Ban reported user</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        {tab === 'disputes' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {disputes.length === 0 && (
      <div className="empty-state"><h3>No disputes</h3><p>All deals are going smoothly!</p></div>
    )}
    {disputes.map(d => (
      <div key={d.id} className="card" style={{ borderLeft: '3px solid #dc2626' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
          ⚠️ Disputed deal
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          {d.proposer?.full_name} ↔ {d.receiver?.full_name}
          {d.listing?.offer_title && ` — re: "${d.listing.offer_title}"`}
        </div>
        <div style={{ fontSize: '12px', background: 'var(--bg)', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
          <strong>Deal terms:</strong> {d.terms}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
          Disputed on: {new Date(d.updated_at).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
)}
    </div>
  )
}
