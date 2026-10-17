import { afterEach, describe, expect, it, vi } from 'vitest'
import { PROVIDERS } from '../config/providers'
import { buildBody, groqProvider, parseResponse } from './groq'

const reply = (content: string, finish_reason = 'stop') => ({ choices: [{ finish_reason, message: { content } }] })
const req = () => ({ image: new Blob(['abc'], { type: 'image/jpeg' }), sourceLang: 'en', targetLang: 'de' })

describe('Groq', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('baut eine OpenAI-kompatible Anfrage mit Bild als data-URL', () => {
    const body = buildBody('modell', 'QUJD', 'image/jpeg', 'en', 'de')
    expect(body.model).toBe('modell')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.messages[0].content[1]).toEqual({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,QUJD' } })
  })

  it('liest JSON auch mit Denk-Abschnitt und Code-Zaun', () => {
    const text = '<think>überlegen …</think>\n```json\n{"words":[{"term":"tree","translation":"Baum","warning_note":"x"}]}\n```'
    expect(parseResponse(reply(text))).toEqual([
      { term: 'tree', translation: 'Baum', example_sentence: '', warning_note: 'x', word_type: '' },
    ])
  })

  it('meldet unlesbare Antworten', () => {
    expect(() => parseResponse(reply('Hier sind die Vokabeln: tree – Baum'))).toThrow()
    expect(() => parseResponse(reply('{"words":[', 'length'))).toThrow('length')
    expect(() => parseResponse({})).toThrow()
  })

  it('schickt den Key als Bearer-Token an den konfigurierten Endpunkt', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(reply('{"words":[]}'))))
    vi.stubGlobal('fetch', fetchMock)
    const r = await groqProvider('geheim').recognize(req())
    expect(r.provider).toBe('groq')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(PROVIDERS.groq.endpoint)
    expect(init.headers.Authorization).toBe('Bearer geheim')
    expect(JSON.parse(init.body).model).toBe(PROVIDERS.groq.models![0])
  })

  it('übersetzt Fehler: 401 ungültiger Key, Netzwerkfehler offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
    await expect(groqProvider('k').recognize(req())).rejects.toMatchObject({ code: 'invalid_key' })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(groqProvider('k').recognize(req())).rejects.toMatchObject({ code: 'offline' })
  })
})
