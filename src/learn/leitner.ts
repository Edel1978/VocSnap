import type { Direction, ReviewEvent, ReviewResult } from '../data/types'

export const BOXES = 5

// Lernstand einer Karte (Wort + Richtung). Neue Karten haben keinen Eintrag und gelten als Fach 1, fällig.
export interface CardState {
  box: number
  lastAt: string
}

export function cardKey(wordId: string, direction: Direction): string {
  return `${wordId}|${direction}`
}

export function nextBox(box: number, result: ReviewResult): number {
  if (result === 'wrong') return 1
  if (result === 'half') return box
  return Math.min(BOXES, box + 1)
}

// Berechnet den Lernstand vollständig aus den Ereignissen (Reihenfolge nach `at`).
export function computeStates(events: ReviewEvent[]): Map<string, CardState> {
  const states = new Map<string, CardState>()
  const sorted = events.filter((e) => e.deleted_at === null).sort((a, b) => a.at.localeCompare(b.at))
  for (const e of sorted) {
    const key = cardKey(e.word_id, e.direction)
    const box = states.get(key)?.box ?? 1
    states.set(key, { box: nextBox(box, e.result), lastAt: e.at })
  }
  return states
}

// Tage seit 1970 nach lokalem Kalender, damit „morgen" um Mitternacht beginnt.
export function dayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

export function isDue(state: CardState | undefined, intervals: number[], now: Date = new Date()): boolean {
  if (!state) return true
  const wait = intervals[state.box - 1] ?? intervals[intervals.length - 1]
  return dayNumber(new Date(state.lastAt)) + wait <= dayNumber(now)
}

export function boxOf(state: CardState | undefined): number {
  return state?.box ?? 1
}
