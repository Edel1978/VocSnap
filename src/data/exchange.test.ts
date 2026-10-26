import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION } from './db'
import { ImportError, mergeEvents, mergeRecords, parseExchange } from './exchange'
import type { Profile, ReviewEvent } from './types'

const rec = (id: string, updated_at: string, name = id): Profile => ({
  id,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at,
  deleted_at: null,
  device_id: 'd',
  name,
  avatar: '',
  account_id: null,
  plan: 'free',
})

const valid = () => ({
  app: 'vocsnap',
  schema_version: SCHEMA_VERSION,
  exported_at: '2026-01-01T00:00:00.000Z',
  profiles: [rec('p1', '2026-01-01T00:00:00.000Z')],
  lessons: [],
  words: [],
  reviewEvents: [],
  exams: [],
})

describe('parseExchange', () => {
  it('hebt Dateien aus Version 1 an: Klassenarbeiten werden zu Prüfungen', () => {
    const lesson = (id: string, exam_date: string | null) => ({
      ...rec(id, '2026-02-01T00:00:00.000Z'),
      profile_id: 'p1',
      title: id,
      source_lang: 'en',
      target_lang: 'de',
      exam_date,
    })
    const { exams: _, ...old } = valid()
    const d = parseExchange({ ...old, schema_version: 1, lessons: [lesson('l1', '2026-03-01'), lesson('l2', '2026-03-01'), lesson('l3', null)] })
    expect(d.exams).toHaveLength(1)
    expect(d.exams[0]).toMatchObject({ kind: 'klassenarbeit', date: '2026-03-01', lesson_ids: ['l1', 'l2'], word_ids: null })
  })

  it('übernimmt gültige Dateien', () => {
    expect(parseExchange(valid()).profiles).toHaveLength(1)
  })

  it('lehnt fremde Dateien ab', () => {
    expect(() => parseExchange(null)).toThrow(ImportError)
    expect(() => parseExchange({ foo: 1 })).toThrow('keine VocSnap-Exportdatei')
  })

  it('lehnt neuere oder ungültige Versionen ab', () => {
    expect(() => parseExchange({ ...valid(), schema_version: SCHEMA_VERSION + 1 })).toThrow('neueren')
    expect(() => parseExchange({ ...valid(), schema_version: 'x' })).toThrow('Versionsnummer')
  })

  it('lehnt fehlende Tabellen und kaputte Einträge ab', () => {
    const { words: _, ...noWords } = valid()
    expect(() => parseExchange(noWords)).toThrow('words')
    expect(() => parseExchange({ ...valid(), profiles: [{ id: 'x' }] })).toThrow('profiles')
    const noName: Record<string, unknown> = { ...rec('p', 'x') }
    delete noName.name
    expect(() => parseExchange({ ...valid(), profiles: [noName] })).toThrow('profiles')
  })
})

describe('mergeRecords', () => {
  it('jüngste Änderung gewinnt', () => {
    const existing = [rec('a', '2026-01-02T00:00:00.000Z', 'lokal'), rec('b', '2026-01-02T00:00:00.000Z', 'lokal')]
    const incoming = [
      rec('a', '2026-01-03T00:00:00.000Z', 'neu'),
      rec('b', '2026-01-01T00:00:00.000Z', 'alt'),
      rec('c', '2026-01-01T00:00:00.000Z', 'fremd'),
    ]
    expect(mergeRecords(existing, incoming).map((r) => r.name)).toEqual(['neu', 'fremd'])
  })

  it('übernimmt Löschmarkierungen, wenn sie jünger sind', () => {
    const deleted = { ...rec('a', '2026-01-05T00:00:00.000Z'), deleted_at: '2026-01-05T00:00:00.000Z' }
    expect(mergeRecords([rec('a', '2026-01-01T00:00:00.000Z')], [deleted])).toEqual([deleted])
  })
})

describe('mergeEvents', () => {
  it('vereinigt Ereignisse ohne Doppelte', () => {
    const e = (id: string) => ({ id }) as ReviewEvent
    expect(mergeEvents([e('1'), e('2')], [e('2'), e('3'), e('3')]).map((x) => x.id)).toEqual(['3'])
  })
})
