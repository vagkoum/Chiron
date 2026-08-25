import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data?.banned) {
      alert('Your account has been suspended. Contact support if you believe this is a mistake.')
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      // Get IP address
      let ip = null
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipRes.json()
        ip = ipData.ip
      } catch (e) { ip = null }

      // Extract email domain
      const emailDomain = email.split('@')[1]?.toLowerCase() || null

      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email,
        signup_ip: ip,
        email_domain: emailDomain,
      })

      // Create trust score
      await supabase.from('trust_scores').insert({
        user_id: data.user.id,
        score: 0,
        level: 'new',
      }).onConflict('user_id').ignore()

      // Check for duplicate IP — flag if 2+ accounts from same IP
      if (ip) {
        const { data: sameIP } = await supabase
          .from('profiles')
          .select('id')
          .eq('signup_ip', ip)
          .neq('id', data.user.id)

        if (sameIP && sameIP.length >= 1) {
          await supabase
            .from('trust_scores')
            .update({ flagged: true, updated_at: new Date().toISOString() })
            .eq('user_id', data.user.id)
        }
      }

      // Institutional email bonus
      const institutionalDomains = [
        '.edu', '.ac.uk', '.ac.gr', '.edu.gr', '.gov', '.gov.gr',
        'uoa.gr', 'auth.gr', 'ntua.gr', 'upatras.gr'
      ]
      const isInstitutional = institutionalDomains.some(d => emailDomain?.endsWith(d))
      if (isInstitutional) {
        await supabase
          .from('trust_scores')
          .update({ 
            score: 5, 
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', data.user.id)
      }
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) throw error
    setProfile({ ...profile, ...updates })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
