import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROVIDERS, type ProviderId } from '../config/providers'
import { ChainError, resetThrottle, runChain, runGenerate } from './chain'
import { ScanError, type OcrProvider, type ScanErrorCode } from './types'

const req = { image: new Blob(), sourceLang: 'en', targetLang: 'de' }
const ORDER: ProviderId[] = ['gemini', 'groq', 'tesseract']
const KEYS = { gemini: 'g', groq: 'q' }

// Anbieter, die der Reihe nach die angegebenen Ergebnisse liefern.
function fakes(behaviour: Partial<Record<ProviderId, ScanErrorCode | 'ok' | Error>>) {
  const calls: ProviderId[] = []
  const create = (id: ProviderId): OcrProvider => ({
    id,
    async recognize() {
      calls.push(id)
      const b = behaviour[id] ?? 'ok'
      if (b === 'ok') return { provider: id, words: [{ term: 'a', translation: 'b' }], skipped: [] }
      if (b instanceof Error) throw b
      throw new ScanError(b)
    },
  })
  return { calls, create }
}

describe('Anbieter-Kette', () => {
  let clock = 0
  const now = () => clock
  const sleep = vi.fn(async (ms: number) => {
    clock += ms
  })

  beforeEach(() => {
    resetThrottle()
    clock = 1_000_000
    sleep.mockClear()
  })

  it('nimmt den ersten Anbieter, wenn er klappt', async () => {
    const f = fakes({})
    const r = await runChain(ORDER, KEYS, req, { ...f, now, sleep })
    expect(r.result.provider).toBe('gemini')
    expect(f.calls).toEqual(['gemini'])
    expect(r.attempts).toEqual([{ provider: 'gemini' }])
  })

  it.each(['quota', 'busy', 'invalid_key', 'offline', 'bad_response', 'failed'] as const)(
    'wechselt bei %s zum nächsten Anbieter',
    async (code) => {
      const f = fakes({ gemini: code })
      const r = await runChain(ORDER, KEYS, req, { ...f, now, sleep })
      expect(r.result.provider).toBe('groq')
      expect(r.attempts[0]).toMatchObject({ provider: 'gemini', error: code })
    },
  )

  it('fällt bis Tesseract durch', async () => {
    const f = fakes({ gemini: 'busy', groq: 'quota' })
    const r = await runChain(ORDER, KEYS, req, { ...f, now, sleep })
    expect(f.calls).toEqual(['gemini', 'groq', 'tesseract'])
    expect(r.result.provider).toBe('tesseract')
  })

  it('überspringt Anbieter ohne Key', async () => {
    const f = fakes({})
    const r = await runChain(ORDER, { groq: 'q' }, req, { ...f, now, sleep })
    expect(f.calls).toEqual(['groq'])
    expect(r.result.provider).toBe('groq')
    const g = fakes({})
    await runChain(ORDER, { gemini: '  ' }, req, { ...g, now, sleep })
    expect(g.calls).toEqual(['tesseract'])
  })

  it('beachtet die eingestellte Reihenfolge', async () => {
    const f = fakes({})
    await runChain(['groq', 'gemini', 'tesseract'], KEYS, req, { ...f, now, sleep })
    expect(f.calls).toEqual(['groq'])
  })

  it('wertet unerwartete Fehler als fehlgeschlagen', async () => {
    const f = fakes({ gemini: new Error('kaputt') })
    const r = await runChain(ORDER, KEYS, req, { ...f, now, sleep })
    expect(r.attempts[0]).toMatchObject({ provider: 'gemini', error: 'failed' })
  })

  it('meldet alle Versuche, wenn keiner klappt', async () => {
    const f = fakes({ gemini: 'invalid_key', groq: 'offline', tesseract: 'failed' })
    const err = await runChain(ORDER, KEYS, req, { ...f, now, sleep }).catch((e) => e)
    expect(err).toBeInstanceOf(ChainError)
    expect(err.attempts.map((a: { error: string }) => a.error)).toEqual(['invalid_key', 'offline', 'failed'])
  })

  it('wartet zwischen zwei Seiten den Mindestabstand ab', async () => {
    const f = fakes({})
    await runChain(ORDER, KEYS, req, { ...f, now, sleep })
    clock += 1000
    await runChain(ORDER, KEYS, req, { ...f, now, sleep })
    expect(sleep).toHaveBeenCalledWith(PROVIDERS.gemini.minIntervalMs! - 1000)
    clock += 60_000
    sleep.mockClear()
    await runChain(ORDER, KEYS, req, { ...f, now, sleep })
    expect(sleep).not.toHaveBeenCalled()
  })

  it('meldet jeden Versuch für die Anzeige', async () => {
    const f = fakes({ gemini: 'busy' })
    const onTry = vi.fn()
    await runChain(ORDER, KEYS, req, { ...f, now, sleep, onTry })
    expect(onTry.mock.calls.map((c) => c[0])).toEqual(['gemini', 'groq'])
  })
})

describe('KI-Wortlisten', () => {
  const gen = { mode: 'topic' as const, input: 'Arztbesuch', sourceLang: 'fr', targetLang: 'de', count: 10, level: 'easy' as const }

  it('nutzt nur Anbieter, die Listen erstellen können', async () => {
    resetThrottle()
    const calls: ProviderId[] = []
    const create = (id: ProviderId): OcrProvider => ({
      id,
      recognize: async () => ({ provider: id, words: [], skipped: [] }),
      generate: async () => {
        calls.push(id)
        if (id === 'gemini') throw new ScanError('quota')
        return [{ term: 'le médecin', translation: 'der Arzt' }]
      },
    })
    const { result, attempts } = await runGenerate(ORDER, KEYS, gen, { create, sleep: async () => {} })
    expect(calls).toEqual(['gemini', 'groq'])
    expect(result[0].term).toBe('le médecin')
    expect(attempts.map((a) => a.provider)).toEqual(['gemini', 'groq'])
  })

  it('ohne Key gibt es keinen Versuch', async () => {
    await expect(runGenerate(ORDER, {}, gen, { create: () => ({}) as OcrProvider })).rejects.toThrow('Wortliste')
  })
})
