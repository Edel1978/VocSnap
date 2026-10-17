import type { Direction, ReviewResult, Word } from '../data/types'

export type DirectionChoice = Direction | 'both'

// to_target: Begriff (Fremdsprache) wird gezeigt, Übersetzung gefragt. to_source umgekehrt.
export interface StudyItem {
  word: Word
  direction: Direction
}

export function prompt(item: StudyItem): string {
  return item.direction === 'to_target' ? item.word.term : item.word.translation
}

export function solution(item: StudyItem): string {
  return item.direction === 'to_target' ? item.word.translation : item.word.term
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Bei „both" kommt jedes Wort einmal pro Richtung dran.
export function buildItems(words: Word[], dir: DirectionChoice, rnd?: () => number): StudyItem[] {
  const dirs: Direction[] = dir === 'both' ? ['to_target', 'to_source'] : [dir]
  return shuffle(
    words.flatMap((word) => dirs.map((direction) => ({ word, direction }))),
    rnd,
  )
}

export interface SessionState {
  items: StudyItem[]
  index: number
  results: ReviewResult[]
}

export function startSession(items: StudyItem[]): SessionState {
  return { items, index: 0, results: [] }
}

export function current(s: SessionState): StudyItem | undefined {
  return s.items[s.index]
}

export function isFinished(s: SessionState): boolean {
  return s.index >= s.items.length
}

export function answer(s: SessionState, result: ReviewResult): SessionState {
  if (isFinished(s)) return s
  return { ...s, index: s.index + 1, results: [...s.results, result] }
}

// Für die Runde „Fehler wiederholen" direkt im Anschluss.
export function wrongItems(s: SessionState): StudyItem[] {
  return s.items.filter((_, i) => s.results[i] === 'wrong')
}

export function summary(s: SessionState): Record<ReviewResult, number> {
  const out: Record<ReviewResult, number> = { correct: 0, half: 0, wrong: 0 }
  for (const r of s.results) out[r]++
  return out
}
