import { languageLabel } from '../config/languages'
import type { ProviderConfig } from '../config/providers'
import { ScanError, type ScanErrorCode, type ScannedWord } from './types'

// Gemeinsamer Auftrag für alle KI-Anbieter, Antwort als JSON {"words": [...]}.
export function buildPrompt(sourceLang: string, targetLang: string): string {
  const src = languageLabel(sourceLang)
  const tgt = languageLabel(targetLang)
  return [
    `Das Bild zeigt eine Vokabelliste aus einem Schulbuch (${src} – ${tgt}).`,
    `Gib jede Vokabel genau so zurück, wie sie auf dem Bild steht: "term" auf ${src}, "translation" auf ${tgt}.`,
    'Erfinde keine Vokabeln, die nicht auf dem Bild stehen. Lautschrift weglassen.',
    `"example_sentence": ein kurzer, einfacher, selbst ausgedachter Beispielsatz auf ${src} mit dem Begriff (Schulniveau).`,
    `"warning_note": nur wenn der Begriff ein „falscher Freund" für Deutschsprachige ist, ein kurzer Hinweis auf Deutsch, sonst leer.`,
    '"word_type": Wortart auf Deutsch (Nomen, Verb, Adjektiv, Adverb, Ausdruck …).',
    'Antworte nur mit JSON: {"words":[{"term":"","translation":"","example_sentence":"","warning_note":"","word_type":""}]}',
  ].join('\n')
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// Liest {"words": [...]} aus einem Text, auch wenn Denk-Abschnitte oder Code-Zäune drumherum stehen.
export function parseWordsJson(text: string | undefined, detail?: string): ScannedWord[] {
  if (!text?.trim()) throw new ScanError('bad_response', detail ?? 'leere Antwort')
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  let data: unknown
  try {
    data = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    throw new ScanError('bad_response', detail ?? 'kein gültiges JSON')
  }
  const words = (data as { words?: unknown })?.words
  if (!Array.isArray(words)) throw new ScanError('bad_response', 'ohne Wortliste')
  return words
    .map((w) => ({
      term: str(w?.term),
      translation: str(w?.translation),
      example_sentence: str(w?.example_sentence),
      warning_note: str(w?.warning_note),
      word_type: str(w?.word_type),
    }))
    .filter((w) => w.term && w.translation)
}

export function errorForStatus(status: number, body: string): ScanError {
  const code = `Code ${status}`
  if (status === 429) return new ScanError('quota', code)
  if (status === 401 || status === 403 || (status === 400 && /api[_ ]?key/i.test(body))) {
    return new ScanError('invalid_key', code)
  }
  if (status >= 500) return new ScanError('busy', code)
  return new ScanError('failed', code)
}

export async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const RETRYABLE: ScanErrorCode[] = ['busy', 'quota']

// Führt einen Aufruf mit Wiederholungen bei Überlastung oder Limit aus. Versuch i nutzt models[i] (bzw. das letzte Modell).
export async function withRetries<T>(
  cfg: Pick<ProviderConfig, 'models' | 'retryDelaysMs'>,
  call: (model: string) => Promise<T>,
  sleep: (ms: number) => Promise<unknown> = wait,
): Promise<T> {
  const models = cfg.models ?? ['']
  const delays = cfg.retryDelaysMs ?? []
  for (let attempt = 0; ; attempt++) {
    try {
      return await call(models[Math.min(attempt, models.length - 1)])
    } catch (e) {
      if (!(e instanceof ScanError) || !RETRYABLE.includes(e.code) || attempt >= delays.length) throw e
      await sleep(delays[attempt])
    }
  }
}

// fetch mit Übersetzung von Netzwerk- und HTTP-Fehlern.
export async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  } catch {
    throw new ScanError('offline')
  }
  if (!res.ok) throw errorForStatus(res.status, await res.text().catch(() => ''))
  try {
    return await res.json()
  } catch {
    throw new ScanError('bad_response', 'kein JSON')
  }
}
