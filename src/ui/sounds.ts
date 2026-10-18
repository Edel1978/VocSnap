import type { ReviewResult } from '../data/types'

// Töne werden im Browser erzeugt (Web Audio), keine Dateien, offline nutzbar.
// Viele Browser erlauben Ton erst nach einer Berührung, dann bleibt der Start still.
let enabled = true
let ctx: AudioContext | null = null

export function setSounds(on: boolean): void {
  enabled = on
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  return ctx
}

// Gesperrten Kontext verwerfen, sonst erklingen vorgemerkte Töne erst bei der nächsten Berührung.
export function dropBlockedSound(): void {
  if (ctx?.state !== 'suspended') return
  void ctx.close().catch(() => {})
  ctx = null
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

// Kurzes Rauschen für den Auslöser-Klick.
function click(start: number): void {
  const a = audio()
  if (!a) return
  const len = Math.floor(a.sampleRate * 0.05)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const src = a.createBufferSource()
  const gain = a.createGain()
  gain.gain.value = 0.35
  src.buffer = buf
  src.connect(gain).connect(a.destination)
  src.start(a.currentTime + start)
}

export const sound = {
  // Start der App: Klick beim Einrasten des Rings, dann aufsteigende Melodie.
  intro: () => {
    click(0.98)
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.1 + i * 0.09, 0.35, 'triangle', 0.14))
  },
  result: (r: ReviewResult) => {
    if (r === 'correct') {
      tone(880, 0, 0.12, 'triangle')
      tone(1318.5, 0.08, 0.18, 'triangle')
    } else if (r === 'half') tone(660, 0, 0.18, 'triangle')
    else {
      tone(220, 0, 0.18, 'square', 0.06)
      tone(185, 0.12, 0.22, 'square', 0.06)
    }
  },
  celebrate: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.14)),
  tap: () => tone(1200, 0, 0.05, 'sine', 0.06),
}
