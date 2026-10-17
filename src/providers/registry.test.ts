import { describe, expect, it } from 'vitest'
import { createProvider, resolveProvider } from './registry'
import { ScanError } from './types'

describe('resolveProvider', () => {
  it('nutzt Tesseract ohne Key', () => {
    expect(resolveProvider('gemini', {})).toBe('tesseract')
    expect(resolveProvider('gemini', { gemini: '  ' })).toBe('tesseract')
  })
  it('nutzt Gemini mit Key', () => {
    expect(resolveProvider('gemini', { gemini: 'abc' })).toBe('gemini')
  })
  it('Tesseract braucht keinen Key', () => {
    expect(resolveProvider('tesseract', {})).toBe('tesseract')
  })
  it('fällt bei unbekanntem Anbieter zurück', () => {
    expect(resolveProvider('gibtsnicht' as never, {})).toBe('tesseract')
  })
})

describe('createProvider', () => {
  it('meldet fehlende Umsetzung als ScanError', async () => {
    const p = createProvider('tesseract')
    await expect(p.recognize({ image: new Blob(), sourceLang: 'en', targetLang: 'de' })).rejects.toBeInstanceOf(
      ScanError,
    )
  })
})
