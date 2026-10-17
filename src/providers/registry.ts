import type { ProviderId } from '../config/providers'
import { geminiProvider } from './gemini'
import { groqProvider } from './groq'
import { tesseractProvider } from './tesseract'
import type { OcrProvider } from './types'

export type ApiKeys = Partial<Record<ProviderId, string>>

export function createProvider(id: ProviderId, keys: ApiKeys): OcrProvider {
  switch (id) {
    case 'gemini':
      return geminiProvider(keys.gemini?.trim() ?? '')
    case 'groq':
      return groqProvider(keys.groq?.trim() ?? '')
    case 'tesseract':
      return tesseractProvider
  }
}
