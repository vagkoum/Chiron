import { useEffect } from 'react'

export default function SplashScreen({ onDone }) {

  useEffect(() => {
    const doneTimer = setTimeout(() => onDone(), 2450)
    return () => {
      clearTimeout(doneTimer)
    }
  }, [onDone])

  function skip() {
    onDone()
  }

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed', inset: 0, background: '#EFDFC6',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, cursor: 'pointer', overflow: 'hidden',
      }}
    >
     <img
        src="/logo.png"
        alt="Chiron"
        style={{
          height: '90px', width: 'auto', objectFit: 'contain',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          animation: 'splashZoomFade 2.4s linear 0.05s both',
        }}
      />

      <style>{`
        @keyframes splashZoomFade {
          0%   { opacity: 0;   transform: scale(0.85); }
          10%  { opacity: 1;   transform: scale(1); }
          90%  { opacity: 1;   transform: scale(2.0); }
          100% { opacity: 0;   transform: scale(2.2); }
        }
      `}</style>
    </div>
  )
}
