import type { Word } from '../data/types'
import { shuffle, solution, type StudyItem } from './session'

// Richtige Antwort plus bis zu drei andere Antworten aus dem Wortpool, gemischt.
export function buildChoices(item: StudyItem, pool: Word[], count = 4, rnd?: () => number): string[] {
  const right = solution(item)
  const seen = new Set([right.toLowerCase()])
  const others: string[] = []
  for (const w of shuffle(pool, rnd)) {
    const a = solution({ ...item, word: w })
    if (!a.trim() || seen.has(a.toLowerCase())) continue
    seen.add(a.toLowerCase())
    others.push(a)
    if (others.length === count - 1) break
  }
  return shuffle([right, ...others], rnd)
}
