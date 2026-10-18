import { useEffect, useState, type CSSProperties } from 'react'
import { LOGO, LogoCard, LogoRing, LogoSpark } from './Logo'

// Nur einmal pro App-Start, nicht bei Seitenwechseln.
let shown = false
const TOTAL_MS = 2300
const REDUCED_MS = 600

const back = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const anim = (...parts: [name: string, ms: number, delay: number, timing?: string, iter?: string][]) =>
  parts.map(([name, ms, delay, timing = back, iter = '1']) => `${name} ${ms}ms ${timing} ${delay}ms ${iter} both`).join(', ')
// SVG-Gruppen um ihre eigene Mitte drehen und skalieren.
const own = (animation: string): CSSProperties => ({ animation, transformBox: 'fill-box', transformOrigin: 'center' })

// Das Logo setzt sich zusammen: Kärtchen wirbelt herein, der Auslöser-Ring dreht sich darum ein,
// es macht „Snap" (Blitz), der Funke leuchtet auf, dann erscheint der Name.
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

  return (
    <div
      role="presentation"
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${LOGO.from}, ${LOGO.to})`,
        animation: anim(['splash-out', 300, TOTAL_MS - 300, 'ease-in']),
      }}
    >
      <svg viewBox="0 0 120 120" className="size-48 drop-shadow-2xl" aria-hidden="true" style={own(anim(['splash-snap', 260, 1000, 'ease-in-out']))}>
        <LogoRing style={own(anim(['splash-ring', 650, 380]))} />
        <LogoCard style={own(anim(['splash-card', 600, 0]))} />
        <LogoSpark style={own(anim(['splash-spark', 420, 1100], ['splash-twinkle', 900, 1600, 'ease-in-out', 'infinite']))} />
      </svg>
      <p className="mt-2 font-display text-5xl font-bold text-white" aria-label="VocSnap">
        {'VocSnap'.split('').map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`inline-block ${i >= 3 ? 'text-orange-300' : ''}`}
            style={{ animation: anim(['splash-letter', 420, 1200 + i * 55]) }}
          >
            {ch}
          </span>
        ))}
      </p>
      <p className="mt-2 font-semibold text-indigo-100" style={{ animation: anim(['splash-letter', 400, 1650]) }}>
        Fotografieren. Lernen. Können.
      </p>
      {/* Kamerablitz beim Einrasten des Rings */}
      <div
        className="pointer-events-none absolute inset-0 bg-white opacity-0"
        style={{ animation: anim(['splash-flash', 380, 980, 'ease-out']) }}
      />
    </div>
  )
}
