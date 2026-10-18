import type { ReviewResult } from '../data/types'

// Kurze Vibration, wo das Gerät es kann (Android). iPhones unterstützen das im Browser nicht.
let enabled = true

export function setHaptics(on: boolean): void {
  enabled = on
}

function vibrate(pattern: number | number[]): void {
  if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}

export const haptic = {
  tap: () => vibrate(8),
  result: (r: ReviewResult) => vibrate(r === 'correct' ? 15 : r === 'half' ? [15, 60, 15] : [40, 50, 40]),
  celebrate: () => vibrate([20, 40, 20, 40, 60]),
}
