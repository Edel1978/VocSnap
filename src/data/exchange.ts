import { SCHEMA_VERSION } from './db'
import { examsFromLessons } from './exams'
import type { Exam, Lesson, Profile, ReviewEvent, SyncRecord, Word } from './types'

// Export-Datei und späteres Sync-Format. Enthält auch gelöschte Datensätze.
export interface ExchangeData {
  app: 'vocsnap'
  schema_version: number
  exported_at: string
  profiles: Profile[]
  lessons: Lesson[]
  words: Word[]
  reviewEvents: ReviewEvent[]
  exams: Exam[]
}

export type ExchangeTables = Pick<ExchangeData, 'profiles' | 'lessons' | 'words' | 'reviewEvents' | 'exams'>

export class ImportError extends Error {
  name = 'ImportError'
}

// Hebt ältere Export-Dateien Schritt für Schritt auf SCHEMA_VERSION. Index = Ausgangsversion.
const UPGRADES: Record<number, (d: Record<string, unknown>) => Record<string, unknown>> = {
  1: (d) => ({ ...d, exams: Array.isArray(d.lessons) ? examsFromLessons(d.lessons as Lesson[]) : [] }),
}

const TABLES = ['profiles', 'lessons', 'words', 'reviewEvents', 'exams'] as const

const REQUIRED: Record<(typeof TABLES)[number], string[]> = {
  profiles: ['name'],
  lessons: ['profile_id', 'title', 'source_lang', 'target_lang'],
  words: ['lesson_id', 'term', 'translation'],
  reviewEvents: ['word_id', 'profile_id', 'direction', 'mode', 'result', 'at'],
  exams: ['profile_id', 'kind', 'date', 'lesson_ids'],
}

function isSyncRecord(r: unknown): r is SyncRecord & Record<string, unknown> {
  if (!r || typeof r !== 'object') return false
  const o = r as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.created_at === 'string' &&
    typeof o.updated_at === 'string' &&
    (o.deleted_at === null || typeof o.deleted_at === 'string') &&
    typeof o.device_id === 'string'
  )
}

// Prüft und migriert eine eingelesene Datei. Wirft ImportError mit verständlicher Meldung.
export function parseExchange(raw: unknown): ExchangeData {
  if (!raw || typeof raw !== 'object' || (raw as Record<string, unknown>).app !== 'vocsnap') {
    throw new ImportError('Das ist keine VocSnap-Exportdatei.')
  }
  let data = raw as Record<string, unknown>
  let version = data.schema_version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new ImportError('Die Datei hat keine gültige Versionsnummer.')
  }
  if (version > SCHEMA_VERSION) {
    throw new ImportError('Die Datei stammt aus einer neueren App-Version. Bitte App aktualisieren.')
  }
  while (version < SCHEMA_VERSION) {
    const up = UPGRADES[version]
    if (!up) throw new ImportError(`Version ${version} kann nicht übernommen werden.`)
    data = up(data)
    version++
  }
  for (const t of TABLES) {
    const rows = data[t]
    if (!Array.isArray(rows)) throw new ImportError(`Tabelle „${t}" fehlt oder ist ungültig.`)
    for (const r of rows) {
      if (!isSyncRecord(r) || REQUIRED[t].some((f) => !(f in r))) {
        throw new ImportError(`Ungültiger Eintrag in „${t}".`)
      }
    }
  }
  return {
    app: 'vocsnap',
    schema_version: SCHEMA_VERSION,
    exported_at: typeof data.exported_at === 'string' ? data.exported_at : '',
    profiles: data.profiles as Profile[],
    lessons: data.lessons as Lesson[],
    words: data.words as Word[],
    reviewEvents: data.reviewEvents as ReviewEvent[],
    exams: data.exams as Exam[],
  }
}

// Konfliktregel: jüngstes updated_at gewinnt. Liefert nur die zu schreibenden Datensätze.
export function mergeRecords<T extends SyncRecord>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((r) => [r.id, r]))
  const out = new Map<string, T>()
  for (const r of incoming) {
    const cur = out.get(r.id) ?? byId.get(r.id)
    if (!cur || r.updated_at > cur.updated_at) out.set(r.id, r)
  }
  return [...out.values()]
}

// Ereignisse werden vereinigt, bekannte IDs bleiben unverändert.
export function mergeEvents(existing: ReviewEvent[], incoming: ReviewEvent[]): ReviewEvent[] {
  const known = new Set(existing.map((e) => e.id))
  const out = new Map<string, ReviewEvent>()
  for (const e of incoming) if (!known.has(e.id)) out.set(e.id, e)
  return [...out.values()]
}

export interface ImportSummary {
  profiles: number
  lessons: number
  words: number
  reviewEvents: number
  exams: number
}
