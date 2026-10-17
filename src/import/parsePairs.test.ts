import { describe, expect, it } from 'vitest'
import { parsePairs } from './parsePairs'

describe('parsePairs', () => {
  it('erkennt gängige Trennzeichen', () => {
    const text = ['house\tHaus', 'tree = Baum', 'to run - laufen', 'la pomme – der Apfel', 'chat; Katze', 'dog   Hund', 'cat: Katze'].join('\n')
    expect(parsePairs(text).pairs).toEqual([
      { term: 'house', translation: 'Haus' },
      { term: 'tree', translation: 'Baum' },
      { term: 'to run', translation: 'laufen' },
      { term: 'la pomme', translation: 'der Apfel' },
      { term: 'chat', translation: 'Katze' },
      { term: 'dog', translation: 'Hund' },
      { term: 'cat', translation: 'Katze' },
    ])
  })

  it('lässt Bindestriche in Wörtern stehen', () => {
    expect(parsePairs('well-known - bekannt').pairs).toEqual([{ term: 'well-known', translation: 'bekannt' }])
  })

  it('überspringt leere und unvollständige Zeilen', () => {
    const r = parsePairs('\n  \nnur ein Wort\nbook = \nkey = Schlüssel\r\n')
    expect(r.pairs).toEqual([{ term: 'key', translation: 'Schlüssel' }])
    expect(r.skipped).toEqual(['nur ein Wort', 'book ='])
  })

  it('liefert bei leerem Text nichts', () => {
    expect(parsePairs('')).toEqual({ pairs: [], skipped: [] })
  })
})
