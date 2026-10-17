import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, localSettingsStore, parseSettings } from './settings'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  }
}

describe('parseSettings', () => {
  it('liefert Standardwerte bei leeren Daten', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('quatsch')).toEqual(DEFAULT_SETTINGS)
  })

  it('übernimmt gültige Werte', () => {
    const s = parseSettings({ theme: 'light', flashcardConfirm: 'swipe', dailyGoal: 5, apiKeys: { gemini: 'k' } })
    expect(s.theme).toBe('light')
    expect(s.flashcardConfirm).toBe('swipe')
    expect(s.dailyGoal).toBe(5)
    expect(s.apiKeys).toEqual({ gemini: 'k' })
  })

  it('verwirft ungültige Werte', () => {
    const s = parseSettings({ theme: 'pink', dailyGoal: -3, leitnerIntervals: [1, 2], provider: 'x', apiKeys: { x: 'k' } })
    expect(s.theme).toBe('dark')
    expect(s.dailyGoal).toBe(20)
    expect(s.leitnerIntervals).toEqual([1, 2, 4, 8, 16])
    expect(s.provider).toBe('tesseract')
    expect(s.apiKeys).toEqual({})
  })

  it('ergänzt fehlende Modi und entfernt unbekannte', () => {
    const s = parseSettings({ modeOrder: ['matching', 'typing', 'typing', 'foo'] })
    expect(s.modeOrder).toEqual(['matching', 'typing', 'flashcard', 'multiple_choice', 'listen_write'])
  })
})

describe('localSettingsStore', () => {
  it('speichert und lädt', () => {
    const store = localSettingsStore(memoryStorage())
    store.save({ ...DEFAULT_SETTINGS, dailyGoal: 7 })
    expect(store.load().dailyGoal).toBe(7)
  })

  it('übersteht kaputtes JSON', () => {
    const storage = memoryStorage()
    storage.setItem('vocsnap.settings', '{kaputt')
    expect(localSettingsStore(storage).load()).toEqual(DEFAULT_SETTINGS)
  })
})
