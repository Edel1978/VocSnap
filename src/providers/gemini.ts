import { PROVIDERS } from '../config/providers'
import { buildPrompt, parseWordsJson, postJson, toBase64, wait, withRetries } from './shared'
import { ScanError, type OcrProvider, type ScanRequest, type ScanResult, type ScannedWord } from './types'

const cfg = PROVIDERS.gemini

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

type GeminiReply = {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[]
}

export function parseResponse(json: unknown): ScannedWord[] {
  const candidate = (json as GeminiReply)?.candidates?.[0]
  const text = candidate?.content?.parts
    ?.filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')
  const detail = candidate?.finishReason && candidate.finishReason !== 'STOP' ? candidate.finishReason : undefined
  return parseWordsJson(text, detail)
}

export function geminiProvider(apiKey: string, sleep: (ms: number) => Promise<unknown> = wait): OcrProvider {
  return {
    id: 'gemini',
    async recognize(req: ScanRequest): Promise<ScanResult> {
      if (!apiKey) throw new ScanError('no_key')
      const body = buildBody(await toBase64(req.image), req.image.type || 'image/jpeg', req.sourceLang, req.targetLang)
      const json = await withRetries(
        cfg,
        (model) => postJson(`${cfg.endpoint}/${model}:generateContent`, { 'x-goog-api-key': apiKey }, body),
        sleep,
      )
      return { provider: 'gemini', words: parseResponse(json), skipped: [] }
    },
  }
}
