import { DEFAULT_PROVIDER_ORDER, PROVIDERS, PROVIDER_IDS, type ProviderId } from '../config/providers'
import { MODE_IDS, type ModeId } from '../modes/modes'

// Gerätebezogene Einstellungen, werden nicht synchronisiert.
export type Theme = 'dark' | 'light'
export type FlashcardConfirm = 'flip' | 'swipe'

export interface TourProgress {
  flow: 'full' | 'short'
  step: number
}

export interface Settings {
  theme: Theme
  flashcardConfirm: FlashcardConfirm
  dailyGoal: number
  modeOrder: ModeId[]
  leitnerIntervals: number[]
  // Reihenfolge der Scan-Anbieter, enthält immer alle.
  providerOrder: ProviderId[]
  apiKeys: Partial<Record<ProviderId, string>>
  // Anbieter, deren Key zuletzt abgelehnt wurde. Wird beim Ändern des Keys gelöscht.
  invalidKeys: ProviderId[]
  activeProfileId: string | null
  // Vibration bei Antworten (nur wo das Gerät es kann).
  haptics: boolean
  // Töne bei Antworten und beim Start.
  sounds: boolean
  // Geführte Einführung erledigt oder übersprungen.
  onboarded: boolean
  // Laufende Einführung: welcher Ablauf und welcher Schritt.
  tour: TourProgress | null
  // Zuletzt gewählter Lernmodus und Richtung, für „Weiterlernen".
  learnMode: ModeId
  learnDirection: 'to_target' | 'to_source' | 'both'
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  flashcardConfirm: 'flip',
  dailyGoal: 20,
  modeOrder: [...MODE_IDS],
  leitnerIntervals: [1, 2, 4, 8, 16],
  providerOrder: [...DEFAULT_PROVIDER_ORDER],
  apiKeys: {},
  invalidKeys: [],
  activeProfileId: null,
  haptics: true,
  sounds: true,
  onboarded: false,
  tour: null,
  learnMode: 'flashcard',
  learnDirection: 'to_target',
}

// Übernimmt eine gespeicherte Reihenfolge, entfernt Unbekanntes und hängt Fehlendes in Standard-Reihenfolge an.
function completeOrder<T extends string>(raw: unknown, known: readonly T[], fallback: readonly T[]): T[] {
  if (!Array.isArray(raw)) return [...fallback]
  const unique = [...new Set(raw.filter((x): x is T => known.includes(x as T)))]
  return [...unique, ...fallback.filter((x) => !unique.includes(x))]
}

const isPosInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0

// Liest beliebige gespeicherte Daten und ersetzt Ungültiges durch Standardwerte.
export function parseSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS }
  if (!raw || typeof raw !== 'object') return s
  const r = raw as Record<string, unknown>
  if (r.theme === 'dark' || r.theme === 'light') s.theme = r.theme
  if (r.flashcardConfirm === 'flip' || r.flashcardConfirm === 'swipe') s.flashcardConfirm = r.flashcardConfirm
  if (isPosInt(r.dailyGoal)) s.dailyGoal = r.dailyGoal
  s.modeOrder = completeOrder(r.modeOrder, MODE_IDS, MODE_IDS)
  if (Array.isArray(r.leitnerIntervals) && r.leitnerIntervals.length === 5 && r.leitnerIntervals.every(isPosInt)) {
    s.leitnerIntervals = [...r.leitnerIntervals]
  }
  s.providerOrder = completeOrder(r.providerOrder, PROVIDER_IDS, DEFAULT_PROVIDER_ORDER)
  if (Array.isArray(r.invalidKeys)) {
    s.invalidKeys = r.invalidKeys.filter((p): p is ProviderId => typeof p === 'string' && p in PROVIDERS)
  }
  if (r.apiKeys && typeof r.apiKeys === 'object') {
    const keys: Settings['apiKeys'] = {}
    for (const [k, v] of Object.entries(r.apiKeys)) {
      if (k in PROVIDERS && typeof v === 'string' && v) keys[k as ProviderId] = v
    }
    s.apiKeys = keys
  }
  if (typeof r.activeProfileId === 'string') s.activeProfileId = r.activeProfileId
  if (typeof r.haptics === 'boolean') s.haptics = r.haptics
  if (typeof r.sounds === 'boolean') s.sounds = r.sounds
  if (typeof r.onboarded === 'boolean') s.onboarded = r.onboarded
  const t = r.tour as Record<string, unknown> | null | undefined
  if (t && (t.flow === 'full' || t.flow === 'short') && Number.isInteger(t.step) && (t.step as number) >= 0) {
    s.tour = { flow: t.flow, step: t.step as number }
  }
  if (MODE_IDS.includes(r.learnMode as ModeId)) s.learnMode = r.learnMode as ModeId
  if (r.learnDirection === 'to_target' || r.learnDirection === 'to_source' || r.learnDirection === 'both') {
    s.learnDirection = r.learnDirection
  }
  return s
}

export interface SettingsStore {
  load(): Settings
  save(s: Settings): void
}

const KEY = 'vocsnap.settings'

export function localSettingsStore(storage: Storage = localStorage): SettingsStore {
  return {
    load() {
      try {
        return parseSettings(JSON.parse(storage.getItem(KEY) ?? 'null'))
      } catch {
        return parseSettings(null)
      }
    },
    save(s) {
      storage.setItem(KEY, JSON.stringify(s))
    },
  }
}
