import { describe, expect, it } from 'vitest'
import type { Word } from '../data/types'
import { lessonProgress } from './progress'

const w = (id: string) => ({ id }) as Word
const st = (box: number) => ({ box, firstAt: 't', lastAt: 't' })

describe('Fortschritt einer Lektion', () => {
  it('zählt neu, wackelig und sicher in den gelernten Richtungen', () => {
    const states = new Map([
      ['a|to_target', st(4)],
      ['b|to_target', st(2)],
      ['a|to_source', st(1)],
    ])
    const one = lessonProgress([w('a'), w('b'), w('c')], states, ['to_target'])
    expect([one.fresh, one.wobbly, one.safe, one.safePct]).toEqual([1, 1, 1, 33])
    // Beide Richtungen: das schwächere zählt.
    const both = lessonProgress([w('a'), w('b'), w('c')], states, ['to_target', 'to_source'])
    expect([both.fresh, both.wobbly, both.safe]).toEqual([2, 1, 0])
    expect(lessonProgress([], states, ['to_target']).safePct).toBe(0)
  })
})
