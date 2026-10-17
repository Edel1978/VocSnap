import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildBody, buildPrompt, errorForStatus, geminiProvider, parseResponse } from './gemini'
import { tesseractLangs } from './tesseract'

const reply = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] })

describe('Gemini', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('nennt die Sprachen im Auftrag', () => {
    expect(buildPrompt('fr', 'de')).toContain('Französisch')
    const body = buildBody('QUJD', 'image/jpeg', 'en', 'de')
    expect(body.contents[0].parts[0]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } })
    expect(body.generationConfig.responseMimeType).toBe('application/json')
  })

  it('liest gültige Antworten und verwirft unvollständige Einträge', () => {
    const words = parseResponse(
      reply(
        JSON.stringify({
          words: [
            { term: ' become ', translation: 'werden', warning_note: 'nicht „bekommen“' },
            { term: 'x' },
            { term: 'tree', translation: 'Baum', example_sentence: 7 },
          ],
        }),
      ),
    )
    expect(words).toEqual([
      { term: 'become', translation: 'werden', example_sentence: '', warning_note: 'nicht „bekommen“', word_type: '' },
      { term: 'tree', translation: 'Baum', example_sentence: '', warning_note: '', word_type: '' },
    ])
  })

  it('wirft bei kaputten Antworten', () => {
    expect(() => parseResponse({})).toThrow()
    expect(() => parseResponse(reply('kein json'))).toThrow()
    expect(() => parseResponse(reply('{"foo":1}'))).toThrow()
  })

  it('übersetzt HTTP-Fehler', () => {
    expect(errorForStatus(429, '').code).toBe('quota')
    expect(errorForStatus(400, 'API key not valid').code).toBe('invalid_key')
    expect(errorForStatus(403, '').code).toBe('invalid_key')
    expect(errorForStatus(500, '').code).toBe('failed')
  })

  it('schickt den Key im Header und liefert Wörter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(reply('{"words":[{"term":"cat","translation":"Katze"}]}')), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const r = await geminiProvider('geheim').recognize({
      image: new Blob(['abc'], { type: 'image/png' }),
      sourceLang: 'en',
      targetLang: 'de',
    })
    expect(r.words[0].term).toBe('cat')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).not.toContain('geheim')
    expect(init.headers['x-goog-api-key']).toBe('geheim')
    expect(JSON.parse(init.body).contents[0].parts[0].inline_data.data).toBe(btoa('abc'))
  })

  it('meldet Netzwerkfehler als offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(
      geminiProvider('k').recognize({ image: new Blob(['a']), sourceLang: 'en', targetLang: 'de' }),
    ).rejects.toMatchObject({ code: 'offline' })
  })
})

describe('Tesseract', () => {
  it('wählt Sprachdaten ohne Doppelte', () => {
    expect(tesseractLangs('fr', 'de')).toEqual(['fra', 'deu'])
    expect(tesseractLangs('en', 'en')).toEqual(['eng'])
    expect(tesseractLangs('xx', 'de')).toEqual(['deu'])
  })
})
