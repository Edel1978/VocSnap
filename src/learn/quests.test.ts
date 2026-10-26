import { describe, expect, it } from 'vitest'
import type { ReviewEvent } from '../data/types'
import { QUESTS, questOf, questProgress } from './quests'

let n = 0
const ev = (result: ReviewEvent['result'], word = `w${n}`, mode = 'flashcard', min = n) =>
  ({ id: String(n++), word_id: word, result, mode, at: new Date(2026, 4, 20, 12, min).toISOString(), deleted_at: null }) as ReviewEvent
const q = (id: string) => QUESTS.find((x) => x.id === id)!

describe('Snappys Aufgabe', () => {
  it('wechselt täglich', () => {
    expect(questOf(100).id).not.toBe(questOf(101).id)
    expect(questOf(100)).toBe(questOf(100 + QUESTS.length))
  })

  it('richtig am Stück', () => {
    expect(questProgress(q('combo'), [ev('correct'), ev('correct'), ev('wrong'), ev('correct')], new Map())).toBe(2)
  })

  it('Runden und Lernmodi', () => {
    const round = [ev('correct', 'a', 'flashcard', 0), ev('correct', 'b', 'flashcard', 1), ev('correct', 'a', 'typing', 2)]
    expect(questProgress(q('rounds'), round, new Map())).toBe(2)
    expect(questProgress(q('modes'), round, new Map())).toBe(2)
  })

  it('Fehler ausbügeln zählt nur vorher falsche Wörter', () => {
    const before = new Map([['a', 'wrong' as const], ['b', 'correct' as const]])
    expect(questProgress(q('fix'), [ev('correct', 'a'), ev('correct', 'b')], before)).toBe(1)
  })
})
