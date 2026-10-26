// Einzige Stelle für Anbieter-Namen, Modelle, Reihenfolge und Limits der Texterkennung.
export type ProviderId = 'gemini' | 'groq' | 'tesseract'

export interface ProviderConfig {
  id: ProviderId
  label: string
  requiresKey: boolean
  // Liefert Beispielsatz und Warnhinweis „Falscher Freund".
  extras: boolean
  // Kann Wortlisten zu einem Thema oder aus einem Text erstellen (KI-Wortlisten).
  generates: boolean
  online: boolean
  endpoint?: string
  // Modell je Versuch: erster Eintrag zuerst, Wiederholungen nutzen die folgenden (sparsamere) Modelle.
  models?: string[]
  // Wartezeit vor jeder Wiederholung bei Überlastung oder Limit. Anzahl = Zahl der Wiederholungen.
  retryDelaysMs?: number[]
  // Mindestabstand zwischen zwei Anfragen (Minutenlimit), gilt auch zwischen mehreren Seiten.
  minIntervalMs?: number
  keyUrl?: string
  // Hinweis in den Einstellungen.
  note?: string
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    requiresKey: true,
    extras: true,
    generates: true,
    online: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    // Aliase zeigen auf das aktuelle Flash- bzw. Flash-Lite-Modell. Flash-Lite hat ein eigenes, größeres Kontingent.
    models: ['gemini-flash-latest', 'gemini-flash-lite-latest'],
    retryDelaysMs: [2000, 5000],
    // Kostenlose Stufe ca. 10–15 Anfragen pro Minute (Stand 2026-10, Google veröffentlicht keine festen Zahlen mehr).
    minIntervalMs: 6000,
    keyUrl: 'https://aistudio.google.com/apikey',
    note:
      'Liefert auch Beispielsatz und Warnhinweis. Das Foto wird an Google gesendet. Nutzung laut Google-Bedingungen erst ab 18, den Key erstellt ein Erwachsener. In der EU sehen die Bedingungen für Apps bezahlte Dienste vor.',
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    requiresKey: true,
    extras: true,
    generates: true,
    online: true,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    // Einziges Bildmodell der kostenlosen Stufe (Stand 2026-10, laut Suche, Groq-Doku nicht direkt geprüft).
    models: ['qwen/qwen3.8-27b'],
    retryDelaysMs: [3000],
    // Kostenlose Stufe ca. 30 Anfragen pro Minute, 250 pro Tag (Stand 2026-10, Angaben Dritter).
    minIntervalMs: 2500,
    keyUrl: 'https://console.groq.com/keys',
    note: 'Ersatz, wenn Gemini nicht antwortet. Liefert auch Beispielsatz und Warnhinweis. Das Foto wird an Groq gesendet. Den Key erstellt ein Erwachsener.',
  },
  tesseract: {
    id: 'tesseract',
    label: 'Tesseract',
    requiresKey: false,
    extras: false,
    generates: false,
    online: false,
    note: 'Ohne Key, direkt auf dem Gerät. Das Foto verlässt das Gerät nicht. Nur gedruckter Text, keine Beispielsätze.',
  },
}

// Standard-Reihenfolge der Kette. Tesseract als letzte Notlösung.
export const DEFAULT_PROVIDER_ORDER: ProviderId[] = ['gemini', 'groq', 'tesseract']

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

// KI-Wortlisten: Grenzen für Eingabe und Umfang.
export const GENERATE_MAX_TEXT = 6000
export const GENERATE_COUNTS = [10, 20, 30]

// Sprachcodes der App → Tesseract-Sprachdaten. Neue Sprache: Paket @tesseract.js-data/<code> installieren.
export const TESSERACT_LANGS: Record<string, string> = { en: 'eng', fr: 'fra', de: 'deu' }

// Worker, Kern und Sprachdaten liegen in der App selbst (scripts/copy-tesseract.mjs), relativ zum Basis-Pfad.
export const TESSERACT_ASSETS = 'tesseract/'

// Bilder werden vor der Erkennung auf diese Kantenlänge verkleinert.
export const SCAN_MAX_EDGE = 1600
