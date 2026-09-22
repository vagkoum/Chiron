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
        position: 'fixed', inset: 0, background: '#EFDFC6',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, cursor: 'pointer', overflow: 'hidden',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <img
        src="/logo.png"
        alt="Chiron"
        style={{
          height: '90px', width: 'auto', objectFit: 'contain',
          animation: 'splashZoomFade 1.8s cubic-bezier(0.4, 0, 0.6, 1) both',
        }}
      />

      <style>{`
        @keyframes splashZoomFade {
          0%   { opacity: 0;   transform: scale(0.75); }
          35%  { opacity: 1;   transform: scale(1); }
          75%  { opacity: 1;   transform: scale(1.35); }
          100% { opacity: 0;   transform: scale(1.7); }
        }
      `}</style>
    </div>
  )
}
