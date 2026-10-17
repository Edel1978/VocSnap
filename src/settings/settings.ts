import { DEFAULT_PROVIDER, PROVIDERS, type ProviderId } from '../config/providers'
import { MODE_IDS, type ModeId } from '../modes/modes'

// Gerätebezogene Einstellungen, werden nicht synchronisiert.
export type Theme = 'dark' | 'light'
export type FlashcardConfirm = 'flip' | 'swipe'

export interface Settings {
  theme: Theme
  flashcardConfirm: FlashcardConfirm
  dailyGoal: number
  modeOrder: ModeId[]
  leitnerIntervals: number[]
  provider: ProviderId
  apiKeys: Partial<Record<ProviderId, string>>
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  flashcardConfirm: 'flip',
  dailyGoal: 20,
  modeOrder: [...MODE_IDS],
  leitnerIntervals: [1, 2, 4, 8, 16],
  provider: DEFAULT_PROVIDER,
  apiKeys: {},
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
  if (Array.isArray(r.modeOrder)) {
    const known = r.modeOrder.filter((m): m is ModeId => MODE_IDS.includes(m as ModeId))
    const unique = [...new Set(known)]
    s.modeOrder = [...unique, ...MODE_IDS.filter((m) => !unique.includes(m))]
  }
  if (Array.isArray(r.leitnerIntervals) && r.leitnerIntervals.length === 5 && r.leitnerIntervals.every(isPosInt)) {
    s.leitnerIntervals = [...r.leitnerIntervals]
  }
  if (typeof r.provider === 'string' && r.provider in PROVIDERS) s.provider = r.provider as ProviderId
  if (r.apiKeys && typeof r.apiKeys === 'object') {
    const keys: Settings['apiKeys'] = {}
    for (const [k, v] of Object.entries(r.apiKeys)) {
      if (k in PROVIDERS && typeof v === 'string' && v) keys[k as ProviderId] = v
    }
    s.apiKeys = keys
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
