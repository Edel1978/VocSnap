import { describe, expect, it } from 'vitest'
import type { Word } from '../data/types'
import { buildChoices } from './choices'

const w = (id: string, translation: string) => ({ id, term: `t${id}`, translation }) as Word
const langs = { source: 'en', target: 'de' }

describe('buildChoices', () => {
  it('liefert die richtige Antwort und drei verschiedene andere', () => {
    const pool = [w('1', 'Haus'), w('2', 'Baum'), w('3', 'haus'), w('4', 'Hund'), w('5', 'Katze'), w('6', 'Maus')]
    const c = buildChoices({ word: pool[0], direction: 'to_target', langs }, pool)
    expect(c).toHaveLength(4)
    expect(c).toContain('Haus')
    expect(c).not.toContain('haus')
    expect(new Set(c).size).toBe(4)
  })

  it('kommt mit kleinem Pool aus', () => {
    const pool = [w('1', 'Haus'), w('2', 'Baum')]
    expect(buildChoices({ word: pool[0], direction: 'to_target', langs }, pool).sort()).toEqual(['Baum', 'Haus'])
  })

  it('nutzt in Gegenrichtung die Begriffe', () => {
    const pool = [w('1', 'Haus'), w('2', 'Baum')]
    expect(buildChoices({ word: pool[0], direction: 'to_source', langs }, pool).sort()).toEqual(['t1', 't2'])
  })
})
