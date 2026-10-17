import type { Table } from 'dexie'
import type { VocSnapDb } from './db'
import { newId, nowIso } from './ids'
import type { Store } from './store'
import type { Lesson, Profile, ReviewEvent, SyncRecord, Word } from './types'

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
    const now = nowIso()
    await this.update(table, id, { deleted_at: now } as Partial<T>)
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
    return this.remove(this.db.profiles, id)
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
    return this.remove(this.db.lessons, id)
  }

  listWords(lessonId: string) {
    return this.active(this.db.words.where('lesson_id').equals(lessonId).toArray())
  }
  getWord(id: string) {
    return this.get(this.db.words, id)
  }
  async createWord(input: Parameters<Store['createWord']>[0]) {
    const row: Word = {
      example_sentence: '',
      warning_note: '',
      word_type: '',
      image: null,
      ...input,
      ...this.meta(),
    }
    await this.db.words.add(row)
    return row
  }
  updateWord(id: string, patch: Parameters<Store['updateWord']>[1]) {
    return this.update(this.db.words, id, patch)
  }
  deleteWord(id: string) {
    return this.remove(this.db.words, id)
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
}
