import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const SLIDES = [
  {
    title: 'Welcome to Chiron',
    body: "Before you get started — we strongly recommend using your real name. It builds trust with the people you negotiate with, makes disputes far easier to resolve fairly, and makes it much harder for anyone to scam another user while hiding behind an anonymous name.",
  },
  {
    title: 'Every kind of idea has a home here',
    body: "Scientific projects, novel inventions, literature, song lyrics, laboratory collaborations — Chiron brings together people across very different fields who are each looking for the same thing: someone who can bring their idea forward.",
  },
  {
    title: 'Exchange, improve, and pass it on',
    body: "When you acquire an idea, it's yours to build on — refine it, add your own work, and repost it as your own listing when you're ready. The original creator keeps permanent credit, no matter how many times an idea changes hands.",
  },
  {
    title: 'Discover ideas from anywhere',
    body: "Browse by language, target country, or audience to find opportunities you'd never come across otherwise — a collaboration in another country, a match for a specific market, or an idea meant exactly for someone like you.",
  },
]

export default function OnboardingModal({ onDone }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')

  async function finish() {
    await supabase.from('profiles').update({ has_seen_onboarding: true }).eq('id', user.id)
    onDone()
  }

  function next() {
    if (step === SLIDES.length - 1) { finish(); return }
    setDirection('forward')
    setStep(s => s + 1)
  }

  function back() {
    setDirection('back')
    setStep(s => Math.max(0, s - 1))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '14px',
        maxWidth: '460px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
          <div
            key={step}
            style={{
              padding: '2rem 1.75rem 1.5rem',
              animation: `${direction === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.35s ease`,
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{SLIDES[step].title}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{SLIDES[step].body}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.25rem' }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: i === step ? '#0F6E56' : 'var(--border)'
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1.75rem 1.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={finish}>Skip</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 0 && <button className="btn btn-outline btn-sm" onClick={back}>Back</button>}
            <button className="btn btn-primary btn-sm" onClick={next}>
              {step === SLIDES.length - 1 ? "Let's go" : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
