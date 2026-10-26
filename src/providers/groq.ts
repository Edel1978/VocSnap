import { PROVIDERS } from '../config/providers'
import { buildGeneratePrompt, buildPrompt, parseWordsJson, postJson, toBase64, wait, withRetries } from './shared'
import { ScanError, type GenerateRequest, type OcrProvider, type ScanRequest, type ScanResult, type ScannedWord } from './types'

const cfg = PROVIDERS.groq

// OpenAI-kompatibles Format, Bild als data-URL.
export function buildBody(model: string, imageBase64: string, mimeType: string, sourceLang: string, targetLang: string) {
  return {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(sourceLang, targetLang) },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  }
}

export function buildGenerateBody(model: string, req: GenerateRequest) {
  return {
    model,
    messages: [{ role: 'user', content: buildGeneratePrompt(req) }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  }
}

type GroqReply = { choices?: { finish_reason?: string; message?: { content?: string } }[] }

export function parseResponse(json: unknown): ScannedWord[] {
  const choice = (json as GroqReply)?.choices?.[0]
  const detail = choice?.finish_reason && choice.finish_reason !== 'stop' ? choice.finish_reason : undefined
  return parseWordsJson(choice?.message?.content, detail)
}

export function groqProvider(apiKey: string, sleep: (ms: number) => Promise<unknown> = wait): OcrProvider {
  return {
    id: 'groq',
    async recognize(req: ScanRequest): Promise<ScanResult> {
      if (!apiKey) throw new ScanError('no_key')
      const image = await toBase64(req.image)
      const mime = req.image.type || 'image/jpeg'
      const json = await withRetries(
        cfg,
        (model) =>
          postJson(cfg.endpoint!, { Authorization: `Bearer ${apiKey}` }, buildBody(model, image, mime, req.sourceLang, req.targetLang)),
        sleep,
      )
      return { provider: 'groq', words: parseResponse(json), skipped: [] }
    },
    async generate(req: GenerateRequest): Promise<ScannedWord[]> {
      if (!apiKey) throw new ScanError('no_key')
      const json = await withRetries(
        cfg,
        (model) => postJson(cfg.endpoint!, { Authorization: `Bearer ${apiKey}` }, buildGenerateBody(model, req)),
        sleep,
      )
      return parseResponse(json)
    },
  }
}
