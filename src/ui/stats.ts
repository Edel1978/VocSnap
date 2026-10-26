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
  const practiced = new Map<string, number>()
  for (const e of events) {
    if (e.deleted_at) continue
    const d = dayNumber(new Date(e.at))
    practiced.set(e.word_id, Math.min(d, practiced.get(e.word_id) ?? d))
  }
  // Nur Prüfungen bis heute: jedes Wort vor dem Tag mindestens einmal geübt.
  const today = isoDay()
  const wordsOf = new Map(words.map((l) => [l.lesson.id, l.words]))
  const examsPrepared = (await store.listExams(profileId)).filter((e) => {
    if (e.date > today) return false
    const ids = e.word_ids ?? e.lesson_ids.flatMap((id) => (wordsOf.get(id) ?? []).map((w) => w.id))
    const day = dayNumber(parseDay(e.date))
    return ids.length > 0 && ids.every((id) => (practiced.get(id) ?? Infinity) < day)
  }).length

  return {
    ...computeStats(events, dailyGoal),
    topBoxCards: [...states.values()].filter((s) => s.box >= 5).length,
    words: words.reduce((n, l) => n + l.words.length, 0),
    examsPrepared,
  }
}
