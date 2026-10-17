import { describe, expect, it } from 'vitest'
import { createProvider } from './registry'
import { ScanError } from './types'

describe('createProvider', () => {
  it('liefert den passenden Anbieter', () => {
    expect(createProvider('tesseract', {}).id).toBe('tesseract')
    expect(createProvider('gemini', { gemini: 'k' }).id).toBe('gemini')
    expect(createProvider('groq', { groq: 'k' }).id).toBe('groq')
  })

  it('meldet fehlenden Key als ScanError', async () => {
    for (const id of ['gemini', 'groq'] as const) {
      const p = createProvider(id, {})
      const req = { image: new Blob(), sourceLang: 'en', targetLang: 'de' }
      await expect(p.recognize(req)).rejects.toBeInstanceOf(ScanError)
      await expect(p.recognize(req)).rejects.toMatchObject({ code: 'no_key' })
    }
  })
})
