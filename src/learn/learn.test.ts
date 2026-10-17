import { describe, expect, it } from 'vitest'
import type { ReviewEvent, Word } from '../data/types'
import { answer, buildItems, current, isFinished, prompt, promptLang, solution, startSession, summary, wrongItems } from './session'
import { learnedToday, wrongWordIds } from './stats'

const word = (id: string): Word =>
  ({ id, term: `t${id}`, translation: `ü${id}`, deleted_at: null }) as Word

const event = (word_id: string, result: ReviewEvent['result'], at: string): ReviewEvent =>
  ({ id: `${word_id}${at}`, word_id, result, at, deleted_at: null }) as ReviewEvent

describe('Lernrunde', () => {
  it('baut Abfragen für eine oder beide Richtungen', () => {
    expect(buildItems([word('1'), word('2')], 'to_target')).toHaveLength(2)
    const both = buildItems([word('1')], 'both')
    expect(both.map((i) => i.direction).sort()).toEqual(['to_source', 'to_target'])
  })

  it('zeigt je nach Richtung Begriff oder Übersetzung', () => {
    const w = word('1')
    const langs = { source: 'en', target: 'de' }
    expect(prompt({ word: w, direction: 'to_target', langs })).toBe('t1')
    expect(solution({ word: w, direction: 'to_target', langs })).toBe('ü1')
    expect(prompt({ word: w, direction: 'to_source', langs })).toBe('ü1')
    expect(promptLang({ word: w, direction: 'to_source', langs })).toBe('de')
    const filtered = buildItems([w, word('2')], 'both', { filter: (i) => i.word.id === '2', langs: () => langs })
    expect(filtered.map((i) => i.direction).sort()).toEqual(['to_source', 'to_target'])
    expect(filtered[0].langs).toEqual(langs)
  })

  it('läuft durch und sammelt Fehler', () => {
    const items = buildItems([word('1'), word('2'), word('3')], 'to_target', { rnd: () => 0.5 })
    let s = startSession(items)
    s = answer(s, 'correct')
    s = answer(s, 'wrong')
    expect(isFinished(s)).toBe(false)
    s = answer(s, 'wrong')
    expect(isFinished(s)).toBe(true)
    expect(current(s)).toBeUndefined()
    expect(answer(s, 'correct')).toBe(s)
    expect(wrongItems(s)).toEqual([items[1], items[2]])
    expect(summary(s)).toEqual({ correct: 1, half: 0, wrong: 2 })
  })

  it('kommt mit leerer Liste zurecht', () => {
    expect(isFinished(startSession(buildItems([], 'both')))).toBe(true)
  })
})

describe('Auswertung der Ereignisse', () => {
  it('erkennt, ob heute gelernt wurde', () => {
    const now = new Date(2026, 4, 10, 18, 0)
    const today = new Date(2026, 4, 10, 7, 0).toISOString()
    const yesterday = new Date(2026, 4, 9, 23, 0).toISOString()
    expect(learnedToday([event('1', 'correct', yesterday)], now)).toBe(false)
    expect(learnedToday([event('1', 'wrong', today)], now)).toBe(true)
    expect(learnedToday([], now)).toBe(false)
  })

  it('liefert Wörter, deren letzte Abfrage falsch war', () => {
    const ids = wrongWordIds([
      event('a', 'wrong', '2026-01-01T10:00:00Z'),
      event('a', 'correct', '2026-01-02T10:00:00Z'),
      event('b', 'correct', '2026-01-01T10:00:00Z'),
      event('b', 'wrong', '2026-01-02T10:00:00Z'),
      event('c', 'wrong', '2026-01-01T10:00:00Z'),
    ])
    expect([...ids].sort()).toEqual(['b', 'c'])
  })
})
