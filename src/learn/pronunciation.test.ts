import { describe, expect, it } from 'vitest'
import type { Word } from '../data/types'
import { judgeSpeech, spokenSide, type Heard } from './pronunciation'

// Erkannte Texte, die erste Alternative mit hoher Sicherheit.
const h = (...t: string[]): Heard[] => t.map((text, i) => ({ text, confidence: i === 0 ? 0.9 : 0 }))

const word = { term: 'the house', translation: 'das Haus' } as Word

describe('Aussprache', () => {
  it('nimmt immer die Fremdsprache', () => {
    expect(spokenSide({ word, direction: 'to_target', langs: { source: 'en', target: 'de' } })).toEqual({
      say: 'the house',
      lang: 'en',
      cue: 'das Haus',
    })
    expect(spokenSide({ word, direction: 'to_target', langs: { source: 'de', target: 'fr' } }).lang).toBe('fr')
  })

  it('ignoriert Schreibweise, Satzzeichen und Artikel', () => {
    expect(judgeSpeech(h('House.'), 'the house')).toBe('correct')
    expect(judgeSpeech(h('the House'), 'house')).toBe('correct')
    expect(judgeSpeech(h('maison'), 'la maison')).toBe('correct')
    expect(judgeSpeech(h("l'école"), "l'école")).toBe('correct')
  })

  it('prüft alle Alternativen und Varianten', () => {
    expect(judgeSpeech(h('house', 'how is'), 'the house')).toBe('correct')
    expect(judgeSpeech(h('big'), 'large, big')).toBe('correct')
  })

  it('streng: nur eine Alternative passt oder undeutlich = halb', () => {
    expect(judgeSpeech(h('how is', 'house'), 'the house')).toBe('half')
    expect(judgeSpeech([{ text: 'house', confidence: 0.5 }], 'house')).toBe('half')
    expect(judgeSpeech([{ text: 'house', confidence: 0 }], 'house')).toBe('correct')
  })

  it('knapp daneben zählt halb, sonst falsch', () => {
    expect(judgeSpeech(h('hause'), 'house')).toBe('half')
    expect(judgeSpeech(h('tomorow'), 'tomorrow')).toBe('half')
    expect(judgeSpeech(h('dog'), 'house')).toBe('wrong')
    expect(judgeSpeech(h(), 'house')).toBe('wrong')
    expect(judgeSpeech(h('at'), 'an')).toBe('wrong')
  })
})
