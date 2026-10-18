import { speechLang } from '../../config/languages'

// Web Speech API, in Chrome mit Präfix. Nicht in allen Browsern vorhanden (z. B. Firefox).
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function canListen(): boolean {
  return !!ctor()
}

export type ListenError = 'not-allowed' | 'network' | 'no-speech' | 'unsupported' | 'failed'

export class ListenFailed extends Error {
  constructor(readonly code: ListenError) {
    super(code)
  }
}

// Hört einmal zu und liefert die erkannten Alternativen. stop() bricht ab.
export function listen(lang: string): { result: Promise<string[]>; stop: () => void } {
  const Ctor = ctor()
  if (!Ctor) return { result: Promise.reject(new ListenFailed('unsupported')), stop: () => {} }
  const rec = new Ctor()
  rec.lang = speechLang(lang)
  rec.interimResults = false
  rec.maxAlternatives = 5
  const result = new Promise<string[]>((resolve, reject) => {
    let heard: string[] = []
    rec.onresult = (e) => {
      const first = e.results[0]
      heard = Array.from({ length: first?.length ?? 0 }, (_, i) => first[i].transcript)
    }
    rec.onerror = (e) => {
      const code: ListenError =
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'not-allowed'
          : e.error === 'network'
            ? 'network'
            : e.error === 'no-speech' || e.error === 'aborted'
              ? 'no-speech'
              : 'failed'
      reject(new ListenFailed(code))
    }
    rec.onend = () => resolve(heard)
  })
  try {
    rec.start()
  } catch {
    return { result: Promise.reject(new ListenFailed('failed')), stop: () => {} }
  }
  return { result, stop: () => rec.abort() }
}

export const LISTEN_ERRORS: Record<ListenError, string> = {
  'not-allowed': 'Kein Zugriff aufs Mikrofon. Erlaube es in den Einstellungen des Browsers.',
  network: 'Die Spracherkennung braucht Internet.',
  'no-speech': 'Ich habe nichts gehört. Versuch es nochmal.',
  unsupported: 'Dieser Browser kann keine Sprache erkennen. Am besten klappt es mit Chrome.',
  failed: 'Das hat nicht geklappt. Versuch es nochmal.',
}
