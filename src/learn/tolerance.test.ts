import { describe, expect, it } from 'vitest'
import { distance, grade, variants } from './tolerance'

describe('Fehlertoleranz', () => {
  it('richtig bei exakter Eingabe, Leerzeichen egal', () => {
    expect(grade('Haus', 'Haus')).toBe('correct')
    expect(grade('  to   run ', 'to run')).toBe('correct')
  })

  it('halb bei falscher Groß-/Kleinschreibung', () => {
    expect(grade('haus', 'Haus')).toBe('half')
  })

  it('halb bei genau einem Buchstaben daneben', () => {
    expect(grade('Hause', 'Haus')).toBe('half')
    expect(grade('Hus', 'Haus')).toBe('half')
    expect(grade('Maus', 'Haus')).toBe('half')
    expect(grade('maus', 'Haus')).toBe('half')
  })

  it('halb bei einem fehlenden Akzent, falsch bei zweien', () => {
    expect(grade('ecole', 'école')).toBe('half')
    expect(grade('eleve', 'élève')).toBe('wrong')
  })

  it('falsch bei zwei Fehlern, leerer Eingabe oder kurzen Wörtern', () => {
    expect(grade('Hund', 'Haus')).toBe('wrong')
    expect(grade('', 'Haus')).toBe('wrong')
    expect(grade('ab', 'an')).toBe('wrong')
  })

  it('akzeptiert jede von mehreren Antworten', () => {
    expect(grade('riesig', 'groß, riesig')).toBe('correct')
    expect(grade('Wagen', 'Auto / Wagen')).toBe('correct')
    expect(grade('Wgen', 'Auto; Wagen')).toBe('half')
  })

  it('Klammern sind optional', () => {
    expect(grade('freuen', '(sich) freuen')).toBe('correct')
    expect(grade('sich freuen', '(sich) freuen')).toBe('correct')
  })

  it('fehlender Artikel ist ein halber Fehler', () => {
    expect(grade('Hund', 'der Hund')).toBe('half')
    expect(grade('maison', 'la maison')).toBe('half')
    expect(grade('arbre', "l'arbre")).toBe('half')
    expect(grade('der Hund', 'der Hund')).toBe('correct')
  })

  it('normalisiert Apostrophe und Unicode', () => {
    expect(grade('l’arbre', "l'arbre")).toBe('correct')
    expect(grade('école', 'école')).toBe('correct')
  })

  it('Hilfsfunktionen', () => {
    expect(distance('kitten', 'sitting', 5)).toBe(3)
    expect(distance('a', 'abcd', 1)).toBe(2)
    expect(variants('(sich) freuen, mögen')).toEqual(['sich freuen', 'freuen', 'mögen'])
  })
})
