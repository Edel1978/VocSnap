import { afterEach, describe, expect, it, vi } from 'vitest'
import { PROVIDERS } from '../config/providers'
import { buildBody, geminiProvider, parseResponse } from './gemini'
import { tesseractLangs } from './tesseract'

const reply = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] })
const req = () => ({ image: new Blob(['abc'], { type: 'image/png' }), sourceLang: 'en', targetLang: 'de' })
const ok = () => new Response(JSON.stringify(reply('{"words":[{"term":"cat","translation":"Katze"}]}')))

describe('Gemini', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('baut die Anfrage mit Bild und JSON-Schema', () => {
    const body = buildBody('QUJD', 'image/jpeg', 'fr', 'de')
    expect(body.contents[0].parts[0]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } })
    expect(body.contents[0].parts[1].text).toContain('Französisch')
    expect(body.generationConfig.responseMimeType).toBe('application/json')
  })

  it('liest Antworten, ignoriert Denk-Teile und nennt den Abbruchgrund', () => {
    const json = { candidates: [{ content: { parts: [{ text: 'hm', thought: true }, { text: '{"words":[]}' }] } }] }
    expect(parseResponse(json)).toEqual([])
    const cut = { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"words":[' }] } }] }
    expect(() => parseResponse(cut)).toThrow('MAX_TOKENS')
    expect(() => parseResponse({})).toThrow()
  })

  it('schickt den Key im Header, nicht in der Adresse', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok())
    vi.stubGlobal('fetch', fetchMock)
    const r = await geminiProvider('geheim').recognize(req())
    expect(r).toMatchObject({ provider: 'gemini', words: [{ term: 'cat' }] })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${PROVIDERS.gemini.endpoint}/${PROVIDERS.gemini.models![0]}:generateContent`)
    expect(url).not.toContain('geheim')
    expect(init.headers['x-goog-api-key']).toBe('geheim')
    expect(JSON.parse(init.body).contents[0].parts[0].inline_data.data).toBe(btoa('abc'))
  })

  it('wiederholt bei Limit mit dem sparsameren Modell und wachsender Wartezeit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(ok())
    vi.stubGlobal('fetch', fetchMock)
    const sleep = vi.fn().mockResolvedValue(undefined)
    await geminiProvider('k', sleep).recognize(req())
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      expect.stringContaining('/gemini-flash-latest:'),
      expect.stringContaining('/gemini-flash-lite-latest:'),
      expect.stringContaining('/gemini-flash-lite-latest:'),
    ])
    expect(sleep.mock.calls.map((c) => c[0])).toEqual(PROVIDERS.gemini.retryDelaysMs)
  })
})

describe('Tesseract', () => {
  it('wählt Sprachdaten ohne Doppelte', () => {
    expect(tesseractLangs('fr', 'de')).toEqual(['fra', 'deu'])
    expect(tesseractLangs('en', 'en')).toEqual(['eng'])
    expect(tesseractLangs('xx', 'de')).toEqual(['deu'])
  })
})
