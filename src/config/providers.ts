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
  endpoint?: string
  keyUrl?: string
  // Hinweis in den Einstellungen.
  note?: string
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  tesseract: {
    id: 'tesseract',
    label: 'Tesseract (kostenlos, ohne Key)',
    requiresKey: false,
    extras: false,
    online: false,
    note: 'Erkennt gedruckten Text direkt auf dem Gerät, das Foto verlässt das Gerät nicht. Handschrift wird schlecht erkannt.',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini (Key nötig)',
    requiresKey: true,
    extras: true,
    online: true,
    // Alias zeigt immer auf das aktuelle Flash-Modell.
    model: 'gemini-flash-latest',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyUrl: 'https://aistudio.google.com/apikey',
    note:
      'Liefert auch Beispielsatz und Warnhinweis. Das Foto wird zur Erkennung an Google gesendet. Nutzung laut Google-Bedingungen erst ab 18, den Key erstellt ein Erwachsener. In der EU sehen die Bedingungen für Apps bezahlte Dienste vor (Abrechnungskonto in Google AI Studio).',
  },
}

export const DEFAULT_PROVIDER: ProviderId = 'tesseract'

// Sprachcodes der App → Tesseract-Sprachdaten. Neue Sprache: Paket @tesseract.js-data/<code> installieren.
export const TESSERACT_LANGS: Record<string, string> = { en: 'eng', fr: 'fra', de: 'deu' }

// Worker, Kern und Sprachdaten liegen in der App selbst (scripts/copy-tesseract.mjs), relativ zum Basis-Pfad.
export const TESSERACT_ASSETS = 'tesseract/'

// Bilder werden vor der Erkennung auf diese Kantenlänge verkleinert.
export const SCAN_MAX_EDGE = 1600
