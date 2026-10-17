// Einzige Stelle für Anbieter-Namen, Modelle und Einstellungen der Texterkennung.
export type ProviderId = 'tesseract' | 'gemini'

export interface ProviderConfig {
  id: ProviderId
  label: string
  requiresKey: boolean
  // Liefert Beispielsatz und Warnhinweis „Falscher Freund".
  extras: boolean
  online: boolean
  model?: string
  keyUrl?: string
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  tesseract: {
    id: 'tesseract',
    label: 'Tesseract (offline, kostenlos)',
    requiresKey: false,
    extras: false,
    online: false,
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini (Key nötig)',
    requiresKey: true,
    extras: true,
    online: true,
    model: 'gemini-2.5-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
}

export const DEFAULT_PROVIDER: ProviderId = 'tesseract'
