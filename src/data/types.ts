// Gemeinsame Pflichtfelder aller synchronisierbaren Datensätze.
export interface SyncRecord {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  device_id: string
}

export type Plan = 'free'

export interface Profile extends SyncRecord {
  name: string
  avatar: string
  account_id: string | null
  plan: Plan
}

export interface Lesson extends SyncRecord {
  profile_id: string
  title: string
  source_lang: string
  target_lang: string
  exam_date: string | null
}

export interface Word extends SyncRecord {
  lesson_id: string
  term: string
  translation: string
  example_sentence: string
  warning_note: string
  word_type: string
  image: string | null
}

export type Direction = 'to_target' | 'to_source'
export type ReviewResult = 'correct' | 'half' | 'wrong'

// Wird nur angehängt, nie geändert.
export interface ReviewEvent extends SyncRecord {
  word_id: string
  profile_id: string
  direction: Direction
  mode: string
  result: ReviewResult
  at: string
}

type Fields<T extends SyncRecord> = Omit<T, keyof SyncRecord>

export type ProfileInput = Pick<Profile, 'name'> & Partial<Fields<Profile>>
export type LessonInput = Pick<Lesson, 'profile_id' | 'title' | 'source_lang' | 'target_lang'> &
  Partial<Fields<Lesson>>
export type WordInput = Pick<Word, 'lesson_id' | 'term' | 'translation'> & Partial<Fields<Word>>
export type ReviewEventInput = Omit<Fields<ReviewEvent>, 'at'> & { at?: string }
