import type { ReviewResult } from '../data/types'
import { sound } from './sounds'

// Kurze Vibration, wo das Gerät es kann (Android). iPhones unterstützen das im Browser nicht.
let enabled = true

export function setHaptics(on: boolean): void {
  enabled = on
}

function vibrate(pattern: number | number[]): void {
  if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}

// Rückmeldung für Hand und Ohr: Vibration und Ton, jeweils einzeln abschaltbar.
export const haptic = {
  tap: () => {
    vibrate(8)
    sound.tap()
  },
  result: (r: ReviewResult) => {
    vibrate(r === 'correct' ? 15 : r === 'half' ? [15, 60, 15] : [40, 50, 40])
    sound.result(r)
  },
  celebrate: () => {
    vibrate([20, 40, 20, 40, 60])
    sound.celebrate()
  },
}
