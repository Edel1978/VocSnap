import type { ReviewResult } from '../data/types'
import { solution, type StudyItem } from './session'

// Passt die gewählte Antwort zur Abfrage? Gleicher Text zählt auch (z. B. zwei Wörter mit gleicher Übersetzung).
export function isMatch(item: StudyItem, answer: StudyItem): boolean {
  return item === answer || solution(item).trim().toLowerCase() === solution(answer).trim().toLowerCase()
}

// Ergebnis je Abfrage: richtig, wenn sie ohne Fehlversuch zugeordnet wurde.
export function matchingResults(items: StudyItem[], missed: Set<number>): { item: StudyItem; result: ReviewResult }[] {
  return items.map((item, i) => ({ item, result: missed.has(i) ? 'wrong' : 'correct' }))
}
