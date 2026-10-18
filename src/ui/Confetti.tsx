import { useEffect, useRef } from 'react'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']

// Kurzes Konfetti über dem ganzen Bildschirm. Entfällt bei „Bewegung reduzieren".
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const parts = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10 - 4,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: Math.random() * Math.PI,
    }))
    let frame = 0
    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of parts) {
        p.vy += 0.3
        p.x += p.vx
        p.y += p.vy
        p.spin += 0.2
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size * Math.abs(Math.cos(p.spin)))
      }
      if (++frame < 150) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50" aria-hidden="true" />
}
