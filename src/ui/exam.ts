import type { Store } from '../data/store'
import type { Direction, Exam, ExamKind, Lesson, Word } from '../data/types'
import { planExam, type ExamPlan, type PlanCard } from '../learn/examPlan'
import { cardKey, computeStates, type CardState } from '../learn/leitner'

const DIRS: Direction[] = ['to_target', 'to_source']

export const EXAM_LABEL: Record<ExamKind, string> = { test: 'Vokabeltest', klassenarbeit: 'Klassenarbeit' }

export interface ExamData {
  exam: Exam
  lessons: Lesson[]
  words: Word[]
  states: Map<string, CardState>
  plan: ExamPlan
}

// Wörter einer Prüfung: alle Wörter der Lektionen oder nur die ausgewählten.
export async function examWords(store: Store, exam: Exam): Promise<{ lessons: Lesson[]; words: Word[] }> {
  const lessons = (await Promise.all(exam.lesson_ids.map((id) => store.getLesson(id)))).filter((l): l is Lesson => !!l)
  const all = (await Promise.all(lessons.map((l) => store.listWords(l.id)))).flat()
  const chosen = exam.word_ids ? new Set(exam.word_ids) : null
  const words = chosen ? all.filter((w) => chosen.has(w.id)) : all
  words.sort((a, b) => a.created_at.localeCompare(b.created_at))
  return { lessons, words }
}

export async function loadExam(store: Store, exam: Exam, intervals: number[]): Promise<ExamData> {
  const { lessons, words } = await examWords(store, exam)
  const states = computeStates(await store.listReviewEvents(exam.profile_id))
  const cards: PlanCard[] = words.flatMap((w) => DIRS.map((d) => ({ key: cardKey(w.id, d), state: states.get(cardKey(w.id, d)) })))
  return { exam, lessons, words, states, plan: planExam(cards, exam.date, intervals, new Date(), exam.kind === 'test') }
}

export function upcomingExams(exams: Exam[], fromIso: string): Exam[] {
  return exams.filter((e) => e.date >= fromIso).sort((a, b) => a.date.localeCompare(b.date))
}
