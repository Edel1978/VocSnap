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

export type ScanErrorCode = 'no_key' | 'invalid_key' | 'quota' | 'offline' | 'failed'

export const SCAN_ERROR_TEXT: Record<ScanErrorCode, string> = {
  no_key: 'Für diesen Anbieter fehlt der Key.',
  invalid_key: 'Der Key wurde abgelehnt. Bitte in den Einstellungen prüfen.',
  quota: 'Das Kontingent ist aufgebraucht. Später erneut versuchen oder Tesseract nutzen.',
  offline: 'Keine Internetverbindung. Für diesen Scan wird Internet gebraucht.',
  failed: 'Die Erkennung ist fehlgeschlagen. Bitte mit einem schärferen, geraden Foto erneut versuchen.',
}

export class ScanError extends Error {
  constructor(
    public code: ScanErrorCode,
    message: string = SCAN_ERROR_TEXT[code],
  ) {
    super(message)
    this.name = 'ScanError'
  }
}

export interface OcrProvider {
  id: ProviderId
  recognize(req: ScanRequest): Promise<ScanResult>
}
