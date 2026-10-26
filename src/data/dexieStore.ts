import type { Table } from 'dexie'
import { SCHEMA_VERSION, type VocSnapDb } from './db'
import { mergeEvents, mergeRecords, type ExchangeData, type ImportSummary } from './exchange'
import { newId, nowIso } from './ids'
import type { Store } from './store'
import type { Exam, Lesson, Profile, ReviewEvent, SyncRecord, Word } from './types'

export class DexieStore implements Store {
  constructor(
    private db: VocSnapDb,
    private deviceId: string,
  ) {}

  private meta(): SyncRecord {
    const now = nowIso()
    return { id: newId(), created_at: now, updated_at: now, deleted_at: null, device_id: this.deviceId }
  }

  private async active<T extends SyncRecord>(rows: Promise<T[]>): Promise<T[]> {
    return (await rows).filter((r) => r.deleted_at === null)
  }

  private async get<T extends SyncRecord>(table: Table<T, string>, id: string): Promise<T | undefined> {
    const row = await table.get(id)
    return row && row.deleted_at === null ? row : undefined
  }

  private async update<T extends SyncRecord>(table: Table<T, string>, id: string, patch: NoInfer<Partial<T>>): Promise<T> {
    const row = await this.get(table, id)
    if (!row) throw new Error(`Datensatz ${id} nicht gefunden`)
    const next = { ...row, ...patch, id, updated_at: nowIso(), device_id: this.deviceId }
    await table.put(next)
    return next
  }

  private async remove<T extends SyncRecord>(table: Table<T, string>, id: string): Promise<void> {
    await this.update(table, id, { deleted_at: nowIso() } as Partial<T>)
  }

  private async removeWordsOf(lessonIds: string[]): Promise<void> {
    const words = await this.db.words.where('lesson_id').anyOf(lessonIds).toArray()
    for (const w of words) if (w.deleted_at === null) await this.remove(this.db.words, w.id)
  }

  listProfiles() {
    return this.active(this.db.profiles.toArray())
  }
  getProfile(id: string) {
    return this.get(this.db.profiles, id)
  }
  async createProfile(input: Parameters<Store['createProfile']>[0]) {
    const row: Profile = { avatar: '', account_id: null, plan: 'free', ...input, ...this.meta() }
    await this.db.profiles.add(row)
    return row
  }
  updateProfile(id: string, patch: Parameters<Store['updateProfile']>[1]) {
    return this.update(this.db.profiles, id, patch)
  }
  deleteProfile(id: string) {
    return this.db.transaction('rw', this.db.profiles, this.db.lessons, this.db.words, this.db.exams, async () => {
      const lessons = await this.listLessons(id)
      for (const l of lessons) await this.remove(this.db.lessons, l.id)
      await this.removeWordsOf(lessons.map((l) => l.id))
      for (const e of await this.listExams(id)) await this.remove(this.db.exams, e.id)
      await this.remove(this.db.profiles, id)
    })
  }

  listLessons(profileId: string) {
    return this.active(this.db.lessons.where('profile_id').equals(profileId).toArray())
  }
  getLesson(id: string) {
    return this.get(this.db.lessons, id)
  }
  async createLesson(input: Parameters<Store['createLesson']>[0]) {
    const row: Lesson = { exam_date: null, ...input, ...this.meta() }
    await this.db.lessons.add(row)
    return row
  }
  updateLesson(id: string, patch: Parameters<Store['updateLesson']>[1]) {
    return this.update(this.db.lessons, id, patch)
  }
  deleteLesson(id: string) {
    return this.db.transaction('rw', this.db.lessons, this.db.words, async () => {
      await this.removeWordsOf([id])
      await this.remove(this.db.lessons, id)
    })
  }

  listWords(lessonId: string) {
    return this.active(this.db.words.where('lesson_id').equals(lessonId).toArray())
  }
  getWord(id: string) {
    return this.get(this.db.words, id)
  }
  private wordRow(input: Parameters<Store['createWord']>[0]): Word {
    return { example_sentence: '', warning_note: '', word_type: '', image: null, ...input, ...this.meta() }
  }
  async createWord(input: Parameters<Store['createWord']>[0]) {
    const row = this.wordRow(input)
    await this.db.words.add(row)
    return row
  }
  async createWords(inputs: Parameters<Store['createWords']>[0]) {
    const rows = inputs.map((i) => this.wordRow(i))
    await this.db.transaction('rw', this.db.words, () => this.db.words.bulkAdd(rows))
    return rows
  }
  updateWord(id: string, patch: Parameters<Store['updateWord']>[1]) {
    return this.update(this.db.words, id, patch)
  }
  deleteWord(id: string) {
    return this.remove(this.db.words, id)
  }

  listExams(profileId: string) {
    return this.active(this.db.exams.where('profile_id').equals(profileId).toArray())
  }
  getExam(id: string) {
    return this.get(this.db.exams, id)
  }
  async createExam(input: Parameters<Store['createExam']>[0]) {
    const row: Exam = { word_ids: null, ...input, ...this.meta() }
    await this.db.exams.add(row)
    return row
  }
  updateExam(id: string, patch: Parameters<Store['updateExam']>[1]) {
    return this.update(this.db.exams, id, patch)
  }
  deleteExam(id: string) {
    return this.remove(this.db.exams, id)
  }

  async addReviewEvent(input: Parameters<Store['addReviewEvent']>[0]) {
    const meta = this.meta()
    const row: ReviewEvent = { ...input, at: input.at ?? meta.created_at, ...meta }
    await this.db.reviewEvents.add(row)
    return row
  }
  async listReviewEvents(profileId: string) {
    const rows = await this.active(this.db.reviewEvents.where('profile_id').equals(profileId).toArray())
    return rows.sort((a, b) => a.at.localeCompare(b.at))
  }

  async exportAll(): Promise<ExchangeData> {
    const db = this.db
    return db.transaction('r', [db.profiles, db.lessons, db.words, db.reviewEvents, db.exams], async () => ({
      app: 'vocsnap' as const,
      schema_version: SCHEMA_VERSION,
      exported_at: nowIso(),
      profiles: await db.profiles.toArray(),
      lessons: await db.lessons.toArray(),
      words: await db.words.toArray(),
      reviewEvents: await db.reviewEvents.toArray(),
      exams: await db.exams.toArray(),
    }))
  }

  async importAll(data: ExchangeData): Promise<ImportSummary> {
    const db = this.db
    return db.transaction('rw', [db.profiles, db.lessons, db.words, db.reviewEvents, db.exams], async () => {
      const profiles = mergeRecords(await db.profiles.toArray(), data.profiles)
      const lessons = mergeRecords(await db.lessons.toArray(), data.lessons)
      const words = mergeRecords(await db.words.toArray(), data.words)
      const reviewEvents = mergeEvents(await db.reviewEvents.toArray(), data.reviewEvents)
      const exams = mergeRecords(await db.exams.toArray(), data.exams)
      await db.profiles.bulkPut(profiles)
      await db.lessons.bulkPut(lessons)
      await db.words.bulkPut(words)
      await db.reviewEvents.bulkPut(reviewEvents)
      await db.exams.bulkPut(exams)
      return {
        profiles: profiles.length,
        lessons: lessons.length,
        words: words.length,
        reviewEvents: reviewEvents.length,
        exams: exams.length,
      }
    })
  }
}
