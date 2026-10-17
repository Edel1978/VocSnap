import { describe, expect, it } from 'vitest'
import type { ReviewEvent } from '../data/types'
import { boxOf, cardKey, computeStates, isDue, nextBox } from './leitner'

const INTERVALS = [1, 2, 4, 8, 16]

let n = 0
const ev = (result: ReviewEvent['result'], at: string, word_id = 'w', direction: ReviewEvent['direction'] = 'to_target') =>
  ({ id: String(n++), word_id, direction, result, at, deleted_at: null }) as ReviewEvent

describe('Leitner', () => {
  it('richtig → ein Fach höher, halb → bleibt, falsch → Fach 1', () => {
    expect(nextBox(1, 'correct')).toBe(2)
    expect(nextBox(5, 'correct')).toBe(5)
    expect(nextBox(3, 'half')).toBe(3)
    expect(nextBox(4, 'wrong')).toBe(1)
  })

  it('berechnet das Fach aus den Ereignissen, unabhängig von der Reihenfolge', () => {
    const events = [
      ev('correct', '2026-01-03T10:00:00Z'),
      ev('correct', '2026-01-01T10:00:00Z'),
      ev('half', '2026-01-02T10:00:00Z'),
      ev('wrong', '2026-01-01T10:00:00Z', 'w', 'to_source'),
    ]
    const s = computeStates(events)
    expect(s.get(cardKey('w', 'to_target'))).toEqual({ box: 3, lastAt: '2026-01-03T10:00:00Z' })
    expect(boxOf(s.get(cardKey('w', 'to_source')))).toBe(1)
    expect(boxOf(s.get(cardKey('neu', 'to_target')))).toBe(1)
  })

  it('ignoriert gelöschte Ereignisse', () => {
    const e = { ...ev('correct', '2026-01-01T10:00:00Z'), deleted_at: '2026-01-02T00:00:00Z' }
    expect(computeStates([e]).size).toBe(0)
  })

  it('neue Karten sind sofort fällig, sonst nach dem Abstand des Fachs', () => {
    expect(isDue(undefined, INTERVALS)).toBe(true)
    const state = { box: 3, lastAt: new Date(2026, 0, 10, 20, 0).toISOString() }
    expect(isDue(state, INTERVALS, new Date(2026, 0, 13, 23, 0))).toBe(false)
    expect(isDue(state, INTERVALS, new Date(2026, 0, 14, 0, 30))).toBe(true)
    const box1 = { box: 1, lastAt: new Date(2026, 0, 10, 23, 59).toISOString() }
    expect(isDue(box1, INTERVALS, new Date(2026, 0, 10, 23, 59))).toBe(false)
    expect(isDue(box1, INTERVALS, new Date(2026, 0, 11, 0, 1))).toBe(true)
  })
})
