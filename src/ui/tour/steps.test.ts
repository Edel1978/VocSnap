import { describe, expect, it } from 'vitest'
import { exampleWords } from '../../data/examples'
import { advancedByRoute, FULL_TOUR, SHORT_TOUR, startTour, tourSteps } from './steps'

describe('Einführung', () => {
  it('wählt den Ablauf nach vorhandenen Lektionen', () => {
    expect(startTour(false)).toEqual({ flow: 'full', step: 0 })
    expect(startTour(true)).toEqual({ flow: 'short', step: 0 })
    expect(tourSteps('full')).toBe(FULL_TOUR)
    expect(tourSteps('short')).toBe(SHORT_TOUR)
  })

  it('hat eindeutige Schritte, endet mit „Fertig“', () => {
    for (const steps of [FULL_TOUR, SHORT_TOUR]) {
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length)
      expect(steps.at(-1)!.id).toBe('done')
    }
  })

  it('führt einmal durch Lektion, Wörter und Lernrunde', () => {
    expect(FULL_TOUR.map((s) => s.id).slice(1, 10)).toEqual([
      'new-lesson',
      'lesson-form',
      'add-tab',
      'add-ways',
      'learn-lesson',
      'start-round',
      'round',
      'result',
      'round-done',
    ])
  })

  it('geht beim Seitenwechsel weiter', () => {
    const at = (id: string) => FULL_TOUR.findIndex((s) => s.id === id)
    const step = (id: string) => FULL_TOUR[at(id)]
    const next = (id: string) => FULL_TOUR[at(id) + 1]
    expect(advancedByRoute(step('new-lesson'), next('new-lesson'), '/lektion/neu')).toBe(true)
    expect(advancedByRoute(step('lesson-form'), next('lesson-form'), '/lektion/abc')).toBe(true)
    expect(advancedByRoute(step('lesson-form'), next('lesson-form'), '/lektion/neu')).toBe(false)
    expect(advancedByRoute(step('round-done'), next('round-done'), '/')).toBe(true)
    // Unterseiten zum Hinzufügen gehören noch zum Schritt.
    expect(advancedByRoute(step('add-ways'), next('add-ways'), '/lektion/abc/einfuegen')).toBe(false)
    // Andere Seiten halten die Einführung nur an.
    expect(advancedByRoute(step('learn-lesson'), next('learn-lesson'), '/erfolge')).toBe(false)
  })
})

describe('Beispielwörter', () => {
  it('passen zur Sprachrichtung', () => {
    expect(exampleWords('en', 'de')?.[0]).toEqual({ term: 'the dog', translation: 'der Hund' })
    expect(exampleWords('de', 'fr')?.[0]).toEqual({ term: 'der Hund', translation: 'le chien' })
    expect(exampleWords('en', 'fr')).toBeNull()
  })
})
