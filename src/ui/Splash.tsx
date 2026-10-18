import { useEffect, useState } from 'react'
import { Mascot } from './Mascot'

// Nur einmal pro App-Start, nicht bei Seitenwechseln.
let shown = false
const TOTAL_MS = 1900
const REDUCED_MS = 600

const ease = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const anim = (name: string, ms: number, delay: number, timing = ease) => `${name} ${ms}ms ${timing} ${delay}ms both`

// Karten fliegen herein und stapeln sich, Blitz („Snap"), Snappy hüpft heraus, der Name erscheint.
export function Splash() {
  const [visible, setVisible] = useState(!shown)

  useEffect(() => {
    if (!visible) return
    shown = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setVisible(false), reduced ? REDUCED_MS : TOTAL_MS)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible) return null

  const card = 'absolute h-24 w-20 rounded-2xl border-4 border-indigo-950 bg-white'
  return (
    <div
      role="presentation"
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800"
      style={{ animation: anim('splash-out', 300, TOTAL_MS - 300, 'ease-in') }}
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div className={card} style={{ rotate: '-14deg', translate: '-18px 6px', animation: anim('splash-in-left', 450, 0) }} />
        <div className={card} style={{ rotate: '12deg', translate: '18px 6px', animation: anim('splash-in-right', 450, 120) }} />
        <div
          className={`${card} bg-orange-400`}
          style={{ rotate: '-2deg', animation: anim('splash-in-top', 450, 240) }}
        />
        <div className="absolute inset-0" style={{ animation: anim('splash-pop', 520, 760) }}>
          <Mascot mood="cheer" className="h-full w-full drop-shadow-xl" />
        </div>
      </div>
      <p className="mt-4 font-display text-5xl font-bold text-white" aria-label="VocSnap">
        {'VocSnap'.split('').map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`inline-block ${i >= 3 ? 'text-orange-300' : ''}`}
            style={{ animation: anim('splash-letter', 420, 1000 + i * 55) }}
          >
            {ch}
          </span>
        ))}
      </p>
      <p className="mt-2 font-semibold text-indigo-100" style={{ animation: anim('splash-letter', 400, 1450) }}>
        Fotografieren. Lernen. Können.
      </p>
      {/* Kamerablitz */}
      <div
        className="pointer-events-none absolute inset-0 bg-white opacity-0"
        style={{ animation: anim('splash-flash', 380, 560, 'ease-out') }}
      />
    </div>
  )
}
