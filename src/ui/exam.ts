import type { Direction, Lesson, Word } from '../data/types'
import type { Store } from '../data/store'
import { planExam, type ExamPlan, type PlanCard } from '../learn/examPlan'
import { cardKey, computeStates, type CardState } from '../learn/leitner'

const DIRS: Direction[] = ['to_target', 'to_source']

export interface ExamData {
  date: string
  lessons: Lesson[]
  words: Word[]
  states: Map<string, CardState>
  plan: ExamPlan
}

// Eine Klassenarbeit = alle Lektionen des Profils mit demselben exam_date.
export async function loadExam(store: Store, profileId: string, date: string, intervals: number[]): Promise<ExamData> {
  const lessons = (await store.listLessons(profileId)).filter((l) => l.exam_date === date)
  const words = (await Promise.all(lessons.map((l) => store.listWords(l.id)))).flat()
  words.sort((a, b) => a.created_at.localeCompare(b.created_at))
  const states = computeStates(await store.listReviewEvents(profileId))
  const cards: PlanCard[] = words.flatMap((w) =>
    DIRS.map((d) => ({ key: cardKey(w.id, d), state: states.get(cardKey(w.id, d)) })),
  )
  return { date, lessons, words, states, plan: planExam(cards, date, intervals) }
}

export function examDates(lessons: Lesson[], fromIso: string): string[] {
  return [...new Set(lessons.map((l) => l.exam_date).filter((d): d is string => !!d && d >= fromIso))].sort()
}
