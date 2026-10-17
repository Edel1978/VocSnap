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

export type ScanErrorCode = 'no_key' | 'invalid_key' | 'quota' | 'busy' | 'offline' | 'failed'

export const SCAN_ERROR_TEXT: Record<ScanErrorCode, string> = {
  no_key: 'Für diesen Anbieter fehlt der Key.',
  invalid_key: 'Der Key wurde abgelehnt. Bitte in den Einstellungen prüfen.',
  quota: 'Zu viele Anfragen in kurzer Zeit oder Tageskontingent aufgebraucht. Eine Minute warten oder Tesseract nutzen.',
  busy: 'Der Dienst ist gerade überlastet. Bitte gleich noch einmal versuchen oder Tesseract nutzen.',
  offline: 'Keine Internetverbindung. Für diesen Scan wird Internet gebraucht.',
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
