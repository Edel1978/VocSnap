import type { Exam, Lesson } from './types'

// Schema 1 → 2: Klassenarbeiten hingen als exam_date an den Lektionen. Daraus werden eigene Prüfungen.
// Feste IDs je Profil und Datum, damit ein erneuter Import alter Dateien nichts doppelt anlegt.
export function examsFromLessons(lessons: Lesson[]): Exam[] {
  const groups = new Map<string, Lesson[]>()
  for (const l of lessons) {
    if (!l.exam_date || l.deleted_at) continue
    const key = `${l.profile_id}|${l.exam_date}`
    groups.set(key, [...(groups.get(key) ?? []), l])
  }
  return [...groups.values()].map((ls) => {
    const latest = ls.reduce((a, b) => (b.updated_at > a.updated_at ? b : a))
    return {
      id: `ka-${ls[0].profile_id}-${ls[0].exam_date}`,
      created_at: latest.updated_at,
      updated_at: latest.updated_at,
      deleted_at: null,
      device_id: latest.device_id,
      profile_id: ls[0].profile_id,
      kind: 'klassenarbeit',
      date: ls[0].exam_date!,
      lesson_ids: ls.map((l) => l.id),
      word_ids: null,
    }
  })
}
