import type { Store } from '../data/store'
import { isoDay } from '../learn/dates'
import { parseDay } from '../learn/examPlan'
import { computeStates, dayNumber } from '../learn/leitner'
import { computeStats, type BadgeStats } from '../learn/motivation'

export type ProfileStats = BadgeStats

export async function loadStats(store: Store, profileId: string, dailyGoal: number): Promise<ProfileStats> {
  const [events, lessons] = await Promise.all([store.listReviewEvents(profileId), store.listLessons(profileId)])
  const words = await Promise.all(lessons.map(async (l) => ({ lesson: l, words: await store.listWords(l.id) })))
  const states = computeStates(events)
  // Arbeit gut vorbereitet: jedes Wort ihrer Lektionen vor dem Tag der Arbeit mindestens einmal geübt.
  const practiced = new Map<string, number>()
  for (const e of events) {
    if (e.deleted_at) continue
    const d = dayNumber(new Date(e.at))
    practiced.set(e.word_id, Math.min(d, practiced.get(e.word_id) ?? d))
  }
  const today = isoDay()
  const exams = new Map<string, string[]>()
  for (const { lesson, words: list } of words) {
    if (!lesson.exam_date || lesson.exam_date > today) continue
    exams.set(lesson.exam_date, [...(exams.get(lesson.exam_date) ?? []), ...list.map((w) => w.id)])
  }
  const examsPrepared = [...exams].filter(([date, ids]) => {
    const day = dayNumber(parseDay(date))
    return ids.length > 0 && ids.every((id) => (practiced.get(id) ?? Infinity) < day)
  }).length

  return {
    ...computeStats(events, dailyGoal),
    topBoxCards: [...states.values()].filter((s) => s.box >= 5).length,
    words: words.reduce((n, l) => n + l.words.length, 0),
    examsPrepared,
  }
}
