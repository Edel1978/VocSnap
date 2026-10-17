import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, VocSnapDb } from './db'
import { DexieStore } from './dexieStore'

let db: VocSnapDb
let store: DexieStore

beforeEach(async () => {
  db = new VocSnapDb(`test-${crypto.randomUUID()}`)
  store = new DexieStore(db, 'device-a')
})

describe('DexieStore', () => {
  it('öffnet die Datenbank mit aktueller schema_version', async () => {
    await db.open()
    expect(db.verno).toBe(SCHEMA_VERSION)
  })

  it('legt Datensätze mit Pflichtfeldern an', async () => {
    const p = await store.createProfile({ name: 'Test' })
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(p.deleted_at).toBeNull()
    expect(p.device_id).toBe('device-a')
    expect(p.plan).toBe('free')
    expect(p.account_id).toBeNull()
    expect(p.created_at).toBe(p.updated_at)
  })

  it('aktualisiert updated_at, created_at bleibt', async () => {
    const p = await store.createProfile({ name: 'Alt' })
    await new Promise((r) => setTimeout(r, 5))
    const u = await store.updateProfile(p.id, { name: 'Neu' })
    expect(u.name).toBe('Neu')
    expect(u.created_at).toBe(p.created_at)
    expect(u.updated_at > p.updated_at).toBe(true)
  })

  it('löscht nur per Markierung', async () => {
    const p = await store.createProfile({ name: 'X' })
    const l = await store.createLesson({ profile_id: p.id, title: 'L1', source_lang: 'en', target_lang: 'de' })
    const w = await store.createWord({ lesson_id: l.id, term: 'house', translation: 'Haus' })
    await store.deleteWord(w.id)
    expect(await store.listWords(l.id)).toEqual([])
    expect(await store.getWord(w.id)).toBeUndefined()
    const raw = await db.words.get(w.id)
    expect(raw?.deleted_at).not.toBeNull()
  })

  it('filtert Lektionen und Wörter nach Eltern', async () => {
    const a = await store.createProfile({ name: 'A' })
    const b = await store.createProfile({ name: 'B' })
    await store.createLesson({ profile_id: a.id, title: 'A1', source_lang: 'fr', target_lang: 'de' })
    await store.createLesson({ profile_id: b.id, title: 'B1', source_lang: 'en', target_lang: 'de' })
    const lessons = await store.listLessons(a.id)
    expect(lessons.map((l) => l.title)).toEqual(['A1'])
  })

  it('hängt Ereignisse an und liefert sie zeitlich sortiert', async () => {
    const base = { word_id: 'w', profile_id: 'p', direction: 'to_target', mode: 'flashcard' } as const
    await store.addReviewEvent({ ...base, result: 'wrong', at: '2026-01-02T00:00:00.000Z' })
    await store.addReviewEvent({ ...base, result: 'correct', at: '2026-01-01T00:00:00.000Z' })
    const events = await store.listReviewEvents('p')
    expect(events.map((e) => e.result)).toEqual(['correct', 'wrong'])
    expect(await store.listReviewEvents('anderes')).toEqual([])
  })

  it('wirft bei unbekannter ID', async () => {
    await expect(store.updateLesson('fehlt', { title: 'x' })).rejects.toThrow()
  })
})

describe('Löschen mit Abhängigkeiten', () => {
  it('Lektion löschen markiert ihre Wörter mit', async () => {
    const p = await store.createProfile({ name: 'P' })
    const l = await store.createLesson({ profile_id: p.id, title: 'L', source_lang: 'en', target_lang: 'de' })
    const w = await store.createWord({ lesson_id: l.id, term: 'a', translation: 'b' })
    await store.deleteLesson(l.id)
    expect(await store.listLessons(p.id)).toEqual([])
    expect((await db.words.get(w.id))?.deleted_at).not.toBeNull()
  })

  it('Profil löschen markiert Lektionen und Wörter mit', async () => {
    const p = await store.createProfile({ name: 'P' })
    const l = await store.createLesson({ profile_id: p.id, title: 'L', source_lang: 'en', target_lang: 'de' })
    await store.createWord({ lesson_id: l.id, term: 'a', translation: 'b' })
    await store.deleteProfile(p.id)
    const raw = await store.exportAll()
    expect([...raw.profiles, ...raw.lessons, ...raw.words].every((r) => r.deleted_at !== null)).toBe(true)
  })
})

describe('Export und Import', () => {
  it('überträgt alle Daten auf ein anderes Gerät', async () => {
    const p = await store.createProfile({ name: 'P' })
    const l = await store.createLesson({ profile_id: p.id, title: 'L', source_lang: 'en', target_lang: 'de' })
    const w = await store.createWord({ lesson_id: l.id, term: 'a', translation: 'b' })
    await store.addReviewEvent({ word_id: w.id, profile_id: p.id, direction: 'to_target', mode: 'flashcard', result: 'correct' })
    const data = await store.exportAll()

    const other = new DexieStore(new VocSnapDb(`test-${crypto.randomUUID()}`), 'device-b')
    expect(await other.importAll(data)).toEqual({ profiles: 1, lessons: 1, words: 1, reviewEvents: 1 })
    expect((await other.listWords(l.id)).map((x) => x.term)).toEqual(['a'])
    expect(await other.listReviewEvents(p.id)).toHaveLength(1)
    // Zweiter Import ändert nichts.
    expect(await other.importAll(data)).toEqual({ profiles: 0, lessons: 0, words: 0, reviewEvents: 0 })
  })

  it('behält lokal neuere Änderungen', async () => {
    const p = await store.createProfile({ name: 'alt' })
    const data = await store.exportAll()
    await new Promise((r) => setTimeout(r, 5))
    await store.updateProfile(p.id, { name: 'neu' })
    await store.importAll(data)
    expect((await store.getProfile(p.id))?.name).toBe('neu')
  })
})
