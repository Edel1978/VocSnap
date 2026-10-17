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
}

export interface ScanRequest {
  image: Blob
  sourceLang: string
  targetLang: string
}

export type ScanErrorCode = 'no_key' | 'offline' | 'failed' | 'not_implemented'

export class ScanError extends Error {
  constructor(
    public code: ScanErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ScanError'
  }
}

export interface OcrProvider {
  id: ProviderId
  recognize(req: ScanRequest): Promise<ScanResult>
}
