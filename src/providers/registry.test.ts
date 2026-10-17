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
  it('liefert den passenden Anbieter', () => {
    expect(createProvider('tesseract', {}).id).toBe('tesseract')
    expect(createProvider('gemini', { gemini: 'k' }).id).toBe('gemini')
  })

  it('meldet fehlenden Key als ScanError', async () => {
    const p = createProvider('gemini', {})
    await expect(p.recognize({ image: new Blob(), sourceLang: 'en', targetLang: 'de' })).rejects.toMatchObject({
      code: 'no_key',
    })
    await expect(p.recognize({ image: new Blob(), sourceLang: 'en', targetLang: 'de' })).rejects.toBeInstanceOf(ScanError)
  })
})
