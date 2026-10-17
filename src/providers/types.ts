import type { ProviderId } from '../config/providers'

// Einheitliches Ergebnis aller Anbieter für die Prüftabelle.
export interface ScannedWord {
  term: string
  translation: string
  example_sentence?: string
  warning_note?: string
  word_type?: string
}

export interface ScanResult {
  provider: ProviderId
  words: ScannedWord[]
  // Zeilen, die nicht als Paar erkannt wurden.
  skipped: string[]
}

export interface ScanRequest {
  image: Blob
  sourceLang: string
  targetLang: string
  // Fortschritt 0..1, falls der Anbieter ihn kennt.
  onProgress?: (p: number) => void
}

export type ScanErrorCode = 'no_key' | 'invalid_key' | 'quota' | 'busy' | 'offline' | 'bad_response' | 'failed'

export const SCAN_ERROR_TEXT: Record<ScanErrorCode, string> = {
  no_key: 'Kein Key eingetragen.',
  invalid_key: 'Der Key wurde abgelehnt. Bitte in den Einstellungen prüfen.',
  quota: 'Limit erreicht (zu viele Anfragen oder Tageskontingent aufgebraucht).',
  busy: 'Der Dienst ist gerade überlastet.',
  offline: 'Keine Verbindung zum Dienst (kein Internet oder vom Browser blockiert).',
  bad_response: 'Die Antwort war nicht lesbar.',
  failed: 'Die Erkennung ist fehlgeschlagen. Bitte mit einem schärferen, geraden Foto erneut versuchen.',
}

export class ScanError extends Error {
  // detail: technischer Hinweis (z. B. HTTP-Code), wird an die Meldung angehängt.
  constructor(
    public code: ScanErrorCode,
    detail?: string,
  ) {
    super(detail ? `${SCAN_ERROR_TEXT[code]} (${detail})` : SCAN_ERROR_TEXT[code])
    this.name = 'ScanError'
  }
}

export interface OcrProvider {
  id: ProviderId
  recognize(req: ScanRequest): Promise<ScanResult>
}
