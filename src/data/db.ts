import Dexie, { type Table } from 'dexie'
import { examsFromLessons } from './exams'
import type { Exam, Lesson, Profile, ReviewEvent, Word } from './types'

// Jede Schemaänderung: neuen Eintrag anhängen, SCHEMA_VERSION folgt automatisch.
const MIGRATIONS: { stores: Record<string, string>; upgrade?: Parameters<ReturnType<Dexie['version']>['upgrade']>[0] }[] = [
  {
    stores: {
      profiles: 'id, updated_at',
      lessons: 'id, profile_id, updated_at',
      words: 'id, lesson_id, updated_at',
      reviewEvents: 'id, profile_id, word_id, at',
    },
  },
  {
    stores: { exams: 'id, profile_id, date, updated_at' },
    upgrade: async (tx) => {
      const lessons = (await tx.table('lessons').toArray()) as Lesson[]
      await tx.table('exams').bulkPut(examsFromLessons(lessons))
    },
  },
]

export const SCHEMA_VERSION = MIGRATIONS.length

export class VocSnapDb extends Dexie {
  profiles!: Table<Profile, string>
  lessons!: Table<Lesson, string>
  words!: Table<Word, string>
  reviewEvents!: Table<ReviewEvent, string>
  exams!: Table<Exam, string>

  constructor(name = 'vocsnap') {
    super(name)
    MIGRATIONS.forEach((m, i) => {
      const v = this.version(i + 1).stores(m.stores)
      if (m.upgrade) v.upgrade(m.upgrade)
    })
  }
}
