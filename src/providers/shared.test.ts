import { describe, expect, it, vi } from 'vitest'
import { errorForStatus, parseWordsJson, withRetries } from './shared'
import { ScanError } from './types'

const cfg = { models: ['gross', 'klein'], retryDelaysMs: [100, 300] }

describe('withRetries', () => {
  it('wiederholt bei Überlastung und Limit mit wachsender Wartezeit, ab dem zweiten Versuch mit dem kleineren Modell', async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce(new ScanError('busy'))
      .mockRejectedValueOnce(new ScanError('quota'))
      .mockResolvedValueOnce('ok')
    const sleep = vi.fn().mockResolvedValue(undefined)
    expect(await withRetries(cfg, call, sleep)).toBe('ok')
    expect(call.mock.calls.map((c) => c[0])).toEqual(['gross', 'klein', 'klein'])
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([100, 300])
  })

  it('gibt nach allen Wiederholungen auf', async () => {
    const call = vi.fn().mockRejectedValue(new ScanError('busy'))
    await expect(withRetries(cfg, call, async () => {})).rejects.toMatchObject({ code: 'busy' })
    expect(call).toHaveBeenCalledTimes(3)
  })

  it.each(['invalid_key', 'offline', 'bad_response', 'failed'] as const)('wiederholt nicht bei %s', async (code) => {
    const call = vi.fn().mockRejectedValue(new ScanError(code))
    await expect(withRetries(cfg, call, async () => {})).rejects.toMatchObject({ code })
    expect(call).toHaveBeenCalledTimes(1)
  })
})

describe('Fehlerarten', () => {
  it('ordnet HTTP-Codes zu', () => {
    expect(errorForStatus(429, '').code).toBe('quota')
    expect(errorForStatus(400, 'API key not valid').code).toBe('invalid_key')
    expect(errorForStatus(401, '').code).toBe('invalid_key')
    expect(errorForStatus(403, '').code).toBe('invalid_key')
    expect(errorForStatus(503, '').code).toBe('busy')
    expect(errorForStatus(500, '').code).toBe('busy')
    expect(errorForStatus(404, '').code).toBe('failed')
    expect(errorForStatus(503, '').message).toContain('Code 503')
  })

  it('erkennt unlesbare Antworten', () => {
    expect(() => parseWordsJson('')).toThrow(expect.objectContaining({ code: 'bad_response' }))
    expect(() => parseWordsJson('kein json')).toThrow(expect.objectContaining({ code: 'bad_response' }))
    expect(() => parseWordsJson('{"foo":1}')).toThrow(expect.objectContaining({ code: 'bad_response' }))
  })

  it('verwirft unvollständige Einträge', () => {
    const words = parseWordsJson('{"words":[{"term":" become ","translation":"werden"},{"term":"x"},{"term":"a","translation":"b","example_sentence":7}]}')
    expect(words.map((w) => [w.term, w.example_sentence])).toEqual([
      ['become', ''],
      ['a', ''],
    ])
  })
})
