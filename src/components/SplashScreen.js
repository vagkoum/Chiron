import { useEffect } from 'react'

export default function SplashScreen({ onDone }) {

  useEffect(() => {
    const doneTimer = setTimeout(() => onDone(), 2200)
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
          animation: 'splashZoomFade 2.2s ease-in-out both',
        }}
      />

      <style>{`
        @keyframes splashZoomFade {
          0%   { opacity: 0;    transform: scale(0.7); }
          25%  { opacity: 1;    transform: scale(1); }
          65%  { opacity: 1;    transform: scale(1.6); }
          85%  { opacity: 1;    transform: scale(2);   }
          100% { opacity: 0;    transform: scale(2.3); }
        }
      `}</style>>
    </div>
  )
}
