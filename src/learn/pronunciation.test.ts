import { describe, expect, it } from 'vitest'
import type { Word } from '../data/types'
import { judgeSpeech, spokenSide } from './pronunciation'

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
    expect(judgeSpeech(['House.'], 'the house')).toBe('correct')
    expect(judgeSpeech(['the House'], 'house')).toBe('correct')
    expect(judgeSpeech(['maison'], 'la maison')).toBe('correct')
    expect(judgeSpeech(["l'école"], "l'école")).toBe('correct')
  })

  it('prüft alle Alternativen und Varianten', () => {
    expect(judgeSpeech(['how is', 'house'], 'the house')).toBe('correct')
    expect(judgeSpeech(['big'], 'large, big')).toBe('correct')
  })

  it('knapp daneben zählt halb, sonst falsch', () => {
    expect(judgeSpeech(['hause'], 'house')).toBe('half')
    expect(judgeSpeech(['tomorow'], 'tomorrow')).toBe('half')
    expect(judgeSpeech(['dog'], 'house')).toBe('wrong')
    expect(judgeSpeech([], 'house')).toBe('wrong')
    expect(judgeSpeech(['at'], 'an')).toBe('wrong')
  })
})
