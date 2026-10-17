import { PROVIDERS } from '../config/providers'
import { languageLabel } from '../config/languages'
import { ScanError, type OcrProvider, type ScanRequest, type ScanResult, type ScannedWord } from './types'

const cfg = PROVIDERS.gemini

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
  ].join('\n')
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    words: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          term: { type: 'STRING' },
          translation: { type: 'STRING' },
          example_sentence: { type: 'STRING' },
          warning_note: { type: 'STRING' },
          word_type: { type: 'STRING' },
        },
        required: ['term', 'translation'],
      },
    },
  },
  required: ['words'],
}

export function buildBody(imageBase64: string, mimeType: string, sourceLang: string, targetLang: string) {
  return {
    contents: [
      {
        parts: [{ inline_data: { mime_type: mimeType, data: imageBase64 } }, { text: buildPrompt(sourceLang, targetLang) }],
      },
    ],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// Prüft die Antwort und wirft bei unbrauchbarem Inhalt.
export function parseResponse(json: unknown): ScannedWord[] {
  const text = (json as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content
    ?.parts?.map((p) => p.text ?? '')
    .join('')
  if (!text) throw new ScanError('failed')
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ScanError('failed')
  }
  const words = (data as { words?: unknown })?.words
  if (!Array.isArray(words)) throw new ScanError('failed')
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
  if (status === 429) return new ScanError('quota')
  if (status === 401 || status === 403 || (status === 400 && /api[_ ]?key/i.test(body))) return new ScanError('invalid_key')
  return new ScanError('failed')
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

export function geminiProvider(apiKey: string): OcrProvider {
  return {
    id: 'gemini',
    async recognize(req: ScanRequest): Promise<ScanResult> {
      if (!apiKey) throw new ScanError('no_key')
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ScanError('offline')
      const body = buildBody(await toBase64(req.image), req.image.type || 'image/jpeg', req.sourceLang, req.targetLang)
      let res: Response
      try {
        res = await fetch(`${cfg.endpoint}/${cfg.model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
        })
      } catch {
        throw new ScanError('offline')
      }
      if (!res.ok) throw errorForStatus(res.status, await res.text().catch(() => ''))
      return { provider: 'gemini', words: parseResponse(await res.json()), skipped: [] }
    },
  }
}
