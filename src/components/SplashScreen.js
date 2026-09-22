import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }) {
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const dismissTimer = setTimeout(() => setFadingOut(true), 1800)
    const doneTimer = setTimeout(() => onDone(), 2300)
    return () => {
      clearTimeout(dismissTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  function skip() {
    setFadingOut(true)
    setTimeout(() => onDone(), 400)
  }

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed', inset: 0, background: '#faf5ee',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, cursor: 'pointer',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.45s ease',
      }}
    >
      <img
        src="/logo.png"
        alt="Chiron"
        style={{
          height: '90px', width: 'auto', objectFit: 'contain',
          animation: 'splashLogoIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      />
      <div
        style={{
          marginTop: '14px', fontSize: '13px', letterSpacing: '2px',
          color: 'var(--text-muted)', textTransform: 'uppercase',
          animation: 'splashTextIn 0.8s ease 0.5s both',
        }}
      >
        Where ideas find their future
      </div>

      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
