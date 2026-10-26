import type { Direction, Word } from '../data/types'
import { cardKey, type CardState } from './leitner'

export interface LessonProgress {
  // Fach je Wort (0 = noch nie abgefragt), schwächste der gelernten Richtungen.
  boxOf: Map<string, number>
  fresh: number
  wobbly: number
  safe: number
  // Anteil sicherer Wörter in Prozent.
  safePct: number
}

// Fortschritt einer Lektion in den Richtungen, die gerade gelernt werden (Einstellung learnDirection).
export function lessonProgress(words: Word[], states: Map<string, CardState>, dirs: Direction[]): LessonProgress {
  const boxOf = new Map(words.map((w) => [w.id, Math.min(...dirs.map((d) => states.get(cardKey(w.id, d))?.box ?? 0))]))
  const boxes = [...boxOf.values()]
  const safe = boxes.filter((b) => b >= 3).length
  return {
    boxOf,
    fresh: boxes.filter((b) => b === 0).length,
    wobbly: boxes.filter((b) => b === 1 || b === 2).length,
    safe,
    safePct: words.length ? Math.round((safe / words.length) * 100) : 0,
  }
}
