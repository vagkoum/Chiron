import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { DealPanel } from '../components/Deal'
import { AccessRequestPanel } from '../components/NDA'
import { MessageCircle } from 'lucide-react'

export default function Messages() {
  const { user } = useAuth()
  const { threadId } = useParams()
  const navigate = useNavigate()
  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { loadThreads() }, [user])

  useEffect(() => {
    if (!threadId || threads.length === 0) return
    if (activeThread?.id === threadId) return
    const t = threads.find(t => t.id === threadId)
    if (t) openThread(t)
  }, [threadId, threads, activeThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThreads() {
    const { data } = await supabase
      .from('message_threads')
      .select(`id, user1_id, user2_id, listing_id,
        user1:profiles!message_threads_user1_id_fkey(full_name, avatar_url),
        user2:profiles!message_threads_user2_id_fkey(full_name, avatar_url),
        listing:listings(offer_title, user_id),
        messages(content, created_at, read, receiver_id)`)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { referencedTable: 'messages', ascending: false })
    setThreads(data || [])
  }

  async function openThread(thread) {
    setActiveThread(thread)
    navigate(`/messages/${thread.id}`, { replace: true })
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at')
    setMessages(data || [])
    await supabase.from('messages')
      .update({ read: true })
      .eq('thread_id', thread.id)
      .eq('receiver_id', user.id)
    // NEW: reflect the read status locally so the unread badge updates immediately
  setThreads(prev => prev.map(t =>
    t.id === thread.id
      ? {
          ...t,
          messages: (t.messages || []).map(m =>
            m.receiver_id === user.id ? { ...m, read: true } : m
          )
        }
      : t
  ))

    window.dispatchEvent(new Event('messages-read'))
}

  async function sendMessage() {
    if (!newMsg.trim() || !activeThread) return
    setSending(true)
    const receiverId = activeThread.user1_id === user.id ? activeThread.user2_id : activeThread.user1_id
    const { data, error } = await supabase.from('messages').insert({
      thread_id: activeThread.id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: newMsg.trim(),
      read: false,
    }).select().single()
    if (!error && data) {
      setMessages(m => [...m, data])
      setNewMsg('')
      fetch(`/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId })
      }).catch(err => console.error('Notification email failed:', err))
    }
    setSending(false)
  }

  function getOtherName(thread) {
    if (!thread) return ''
    return thread.user1_id === user.id
      ? thread.user2?.full_name || 'User'
      : thread.user1?.full_name || 'User'
  }

  function getOtherId(thread) {
    if (!thread) return ''
    return thread.user1_id === user.id ? thread.user2_id : thread.user1_id
  }
    function getOtherAvatar(thread) {
    if (!thread) return null
    return thread.user1_id === user.id
      ? thread.user2?.avatar_url
      : thread.user1?.avatar_url
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  function getLastMessage(thread) {
    const msgs = thread.messages || []
    if (!msgs.length) return 'No messages yet'
    const last = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    return last.content
  }

  function hasUnread(thread) {
    return (thread.messages || []).some(m => !m.read && m.receiver_id === user.id)
  }

  return (
    <div className="page" style={{ paddingTop: '1.5rem' }}>
      <h2 className="section-title" style={{ marginBottom: '1rem' }}>Messages</h2>

      <div className="msg-layout">
        <div className="msg-sidebar">
          {threads.length === 0 && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No conversations yet.
            </div>
          )}
          {threads.map(t => {
            const name = getOtherName(t)
            const initials = getInitials(name)
            const unread = hasUnread(t)
            return (
              <div
                key={t.id}
                className={`msg-thread-item ${unread ? 'unread' : ''} ${activeThread?.id === t.id ? 'active' : ''}`}
                onClick={() => openThread(t)}
                title={`Open conversation with ${getOtherName(t)}`}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {getOtherAvatar(t) ? (
                    <img src={getOtherAvatar(t)} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '11px' }}>{initials}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: unread ? 600 : 400 }}>{name}</div>
                    {t.listing?.offer_title && (
                      <div style={{ fontSize: '11px', color: 'var(--green-dark)', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        re: {t.listing.offer_title}
                      </div>
                    )}
                    <div className="msg-preview">{getLastMessage(t)}</div>
                  </div>
                  {unread && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />}
                </div>
              </div>
            )
          })}
        </div>

        <div className="msg-main">
          {!activeThread ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <h3>Select a conversation</h3>
              <p>Choose a thread from the left.</p>
            </div>
          ) : (
            <>
              <div className="msg-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={16} color="#0F6E56" /> {getOtherName(activeThread)}</div>
                  {activeThread.listing?.offer_title && (
                    <div style={{ fontSize: '11px', color: 'var(--green-dark)', marginTop: '1px' }}>
                      re: {activeThread.listing.offer_title}
                    </div>
                  )}
                </div>
              </div>
              <div className="msg-body">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 'auto' }}>
                    Start the conversation!
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`msg-bubble ${m.sender_id === user.id ? 'mine' : 'theirs'}`}>
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Deal Panel */}
              <DealPanel
                threadId={activeThread.id}
                listingId={activeThread.listing_id}
                otherUserId={getOtherId(activeThread)}
                otherUserName={getOtherName(activeThread)}
              />

              <AccessRequestPanel
                listingId={activeThread.listing_id}
                listingOwnerId={activeThread.listing?.user_id}
                otherUserId={getOtherId(activeThread)}
                isOwner={activeThread.listing?.user_id === user.id}
              />
              <div className="msg-footer">
                <input
                  className="msg-input"
                  placeholder="Type a message…"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!sending && newMsg.trim()) sendMessage()
                      return false
                    }
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={e => { e.preventDefault(); sendMessage() }}
                  disabled={sending || !newMsg.trim()}
                  title="Send this message">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
