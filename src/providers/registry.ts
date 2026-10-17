import { DEFAULT_PROVIDER, PROVIDERS, type ProviderId } from '../config/providers'
import { ScanError, type OcrProvider } from './types'

// Ohne Key fällt die Auswahl automatisch auf den Standard-Anbieter zurück.
export function resolveProvider(wanted: ProviderId, keys: Partial<Record<ProviderId, string>>): ProviderId {
  const cfg = PROVIDERS[wanted]
  if (!cfg) return DEFAULT_PROVIDER
  if (cfg.requiresKey && !keys[wanted]?.trim()) return DEFAULT_PROVIDER
  return wanted
}

// Umsetzungen folgen in E2.
export function createProvider(id: ProviderId): OcrProvider {
  return {
    id,
    async recognize() {
      throw new ScanError('not_implemented', `${PROVIDERS[id].label}: Scan ist noch nicht verfügbar.`)
    },
  }
}
