import Dexie, { type Table } from 'dexie'
import type { Lesson, Profile, ReviewEvent, Word } from './types'

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
]

export const SCHEMA_VERSION = MIGRATIONS.length

export class VocSnapDb extends Dexie {
  profiles!: Table<Profile, string>
  lessons!: Table<Lesson, string>
  words!: Table<Word, string>
  reviewEvents!: Table<ReviewEvent, string>

  constructor(name = 'vocsnap') {
    super(name)
    MIGRATIONS.forEach((m, i) => {
      const v = this.version(i + 1).stores(m.stores)
      if (m.upgrade) v.upgrade(m.upgrade)
    })
  }
}
