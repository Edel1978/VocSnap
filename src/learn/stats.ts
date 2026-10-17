import type { ReviewEvent } from '../data/types'

function localDay(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function learnedToday(events: ReviewEvent[], now: Date = new Date()): boolean {
  const today = localDay(now.toISOString())
  return events.some((e) => e.deleted_at === null && localDay(e.at) === today)
}

// Wörter, deren letzte Abfrage falsch war (egal in welcher Richtung).
export function wrongWordIds(events: ReviewEvent[]): Set<string> {
  const last = new Map<string, ReviewEvent>()
  for (const e of events) {
    if (e.deleted_at !== null) continue
    const prev = last.get(e.word_id)
    if (!prev || e.at >= prev.at) last.set(e.word_id, e)
  }
  return new Set([...last.values()].filter((e) => e.result === 'wrong').map((e) => e.word_id))
}
