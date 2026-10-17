import { describe, expect, it } from 'vitest'
import { wordsToPairs, type OcrWord } from './layout'

// Hilfsfunktion: Wort mit Position, Zeilenhöhe 20.
const w = (text: string, x: number, y: number, width = text.length * 10): OcrWord => ({
  text,
  x0: x,
  x1: x + width,
  y0: y,
  y1: y + 20,
})

describe('wordsToPairs', () => {
  it('trennt Spalten an der großen Lücke', () => {
    const r = wordsToPairs([w('to', 0, 0), w('run', 25, 2), w('laufen', 300, 1), w('house', 0, 40), w('Haus', 300, 41)])
    expect(r.pairs).toEqual([
      { term: 'to run', translation: 'laufen' },
      { term: 'house', translation: 'Haus' },
    ])
  })

  it('setzt Zeilen aus getrennten Blöcken wieder zusammen', () => {
    // Reihenfolge wie bei Tesseract: erst linke Spalte, dann rechte.
    const r = wordsToPairs([w('tree', 0, 0), w('dog', 0, 40), w('Baum', 300, 3), w('Hund', 300, 38)])
    expect(r.pairs).toEqual([
      { term: 'tree', translation: 'Baum' },
      { term: 'dog', translation: 'Hund' },
    ])
  })

  it('nutzt Trennzeichen, wenn vorhanden', () => {
    const r = wordsToPairs([w('cat', 0, 0), w('=', 35, 0), w('Katze', 50, 0)])
    expect(r.pairs).toEqual([{ term: 'cat', translation: 'Katze' }])
  })

  it('überspringt Zeilen ohne Spaltengrenze', () => {
    const r = wordsToPairs([w('Unit', 0, 0), w('3', 45, 0), w('', 100, 50)])
    expect(r.pairs).toEqual([])
    expect(r.skipped).toEqual(['Unit 3'])
  })

  it('kommt mit leerer Eingabe zurecht', () => {
    expect(wordsToPairs([])).toEqual({ pairs: [], skipped: [] })
  })
})
