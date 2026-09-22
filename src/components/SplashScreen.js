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
          transformOrigin: '18% 50%',
          willChange: 'transform, opacity',
          animation: 'splashZoomFade 2.4s ease-in both',
        }}
      />

      <style>{`
        @keyframes splashZoomFade {
          0%   { opacity: 0; transform: scale(0.7); }
          20%  { opacity: 1; transform: scale(1); }
          45%  { opacity: 1; transform: scale(2.5); }
          70%  { opacity: 1; transform: scale(6); }
          92%  { opacity: 1; transform: scale(12); }
          100% { opacity: 0; transform: scale(14); }
        }
      `}</style>
    </div>
  )
}
