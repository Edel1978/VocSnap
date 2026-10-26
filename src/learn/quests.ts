import type { ReviewEvent, ReviewResult } from '../data/types'

// Snappys Tagesaufgabe: wechselt täglich, wird nur aus den Ereignissen des Tages berechnet.
export interface Quest {
  id: string
  text: string
  target: number
}

export const QUESTS: Quest[] = [
  { id: 'combo', text: '5 richtig am Stück', target: 5 },
  { id: 'rounds', text: '2 Runden spielen', target: 2 },
  { id: 'modes', text: '2 verschiedene Lernmodi', target: 2 },
  { id: 'fix', text: '3 Fehler ausbügeln', target: 3 },
  { id: 'words', text: '10 Wörter gewusst', target: 10 },
]

export const QUEST_BONUS = 20
const ROUND_GAP_MS = 5 * 60_000

export function questOf(day: number): Quest {
  return QUESTS[((day % QUESTS.length) + QUESTS.length) % QUESTS.length]
}

// Fortschritt: today = Ereignisse des Tages (nach Zeit), lastBefore = letztes Ergebnis je Wort vor dem Tag.
export function questProgress(q: Quest, today: ReviewEvent[], lastBefore: Map<string, ReviewResult>): number {
  switch (q.id) {
    case 'combo': {
      let run = 0
      let best = 0
      for (const e of today) {
        run = e.result === 'correct' ? run + 1 : 0
        best = Math.max(best, run)
      }
      return Math.min(best, q.target)
    }
    case 'rounds': {
      let n = 0
      today.forEach((e, i) => {
        const prev = today[i - 1]
        if (!prev || prev.mode !== e.mode || Date.parse(e.at) - Date.parse(prev.at) > ROUND_GAP_MS) n++
      })
      return Math.min(n, q.target)
    }
    case 'modes':
      return Math.min(new Set(today.map((e) => e.mode)).size, q.target)
    case 'fix': {
      const fixed = new Set(today.filter((e) => e.result === 'correct' && lastBefore.get(e.word_id) === 'wrong').map((e) => e.word_id))
      return Math.min(fixed.size, q.target)
    }
    default:
      return Math.min(new Set(today.filter((e) => e.result !== 'wrong').map((e) => e.word_id)).size, q.target)
  }
}
