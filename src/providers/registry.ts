import { DEFAULT_PROVIDER, PROVIDERS, type ProviderId } from '../config/providers'
import { geminiProvider } from './gemini'
import { tesseractProvider } from './tesseract'
import type { OcrProvider } from './types'

// Ohne Key fällt die Auswahl automatisch auf den Standard-Anbieter zurück.
export function resolveProvider(wanted: ProviderId, keys: Partial<Record<ProviderId, string>>): ProviderId {
  const cfg = PROVIDERS[wanted]
  if (!cfg) return DEFAULT_PROVIDER
  if (cfg.requiresKey && !keys[wanted]?.trim()) return DEFAULT_PROVIDER
  return wanted
}

export function createProvider(id: ProviderId, keys: Partial<Record<ProviderId, string>>): OcrProvider {
  switch (id) {
    case 'gemini':
      return geminiProvider(keys.gemini?.trim() ?? '')
    case 'tesseract':
      return tesseractProvider
  }
}
