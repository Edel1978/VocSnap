import { describe, expect, it } from 'vitest'
import type { Word } from '../data/types'
import { isMatch, matchingResults } from './matching'

const langs = { source: 'en', target: 'de' }
const item = (id: string, translation: string) => ({
  word: { id, term: `t${id}`, translation } as Word,
  direction: 'to_target' as const,
  langs,
})

describe('Matching', () => {
  it('erkennt Paare, auch bei gleicher Lösung', () => {
    const a = item('1', 'Haus')
    expect(isMatch(a, a)).toBe(true)
    expect(isMatch(a, item('2', 'haus '))).toBe(true)
    expect(isMatch(a, item('3', 'Baum'))).toBe(false)
  })

  it('wertet Fehlversuche als falsch', () => {
    const items = [item('1', 'a'), item('2', 'b'), item('3', 'c')]
    expect(matchingResults(items, new Set([1])).map((r) => r.result)).toEqual(['correct', 'wrong', 'correct'])
  })
})
