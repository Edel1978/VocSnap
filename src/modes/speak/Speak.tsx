import { useEffect, useRef, useState } from 'react'
import { languageLabel } from '../../config/languages'
import type { ReviewResult } from '../../data/types'
import { CLEAR, judgeSpeech, spokenSide, type Heard } from '../../learn/pronunciation'
import { Icon } from '../../ui/icons'
import { button } from '../../ui/ui'
import { Feedback } from '../shared/Feedback'
import { canSpeak, speak } from '../speech'
import type { ModeProps } from '../types'
import { LISTEN_ERRORS, ListenFailed, listen } from './recognition'

const TRIES = 3

// Das deutsche Wort wird gezeigt, die Fremdsprache ins Mikrofon gesprochen.
// Vor dem ersten Versuch angehört zählt höchstens halb. Undeutlich (halb) darf man nochmal versuchen.
// Ohne Erkennung (Fehler) kann man sich selbst bewerten.
export function Speak({ items, onResults }: ModeProps) {
  const item = items[0]
  const { say, lang, cue } = spokenSide(item)
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState<Heard | null>(null)
  const [almost, setAlmost] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tries, setTries] = useState(0)
  const [hinted, setHinted] = useState(false)
  const [selfRate, setSelfRate] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const stop = useRef<() => void>(() => {})

  useEffect(() => () => stop.current(), [])

  const done = (r: ReviewResult) => {
    stop.current()
    setListening(false)
    setResult(hinted && r === 'correct' ? 'half' : r)
  }

  const start = async () => {
    setError(null)
    setHeard(null)
    setListening(true)
    const run = listen(lang)
    stop.current = run.stop
    try {
      const alts = await run.result
      setListening(false)
      if (alts.length === 0) return setError(LISTEN_ERRORS['no-speech'])
      setHeard(alts[0])
      const r = judgeSpeech(alts, say)
      const n = tries + 1
      setTries(n)
      if (r === 'half' && n < TRIES) return setAlmost(true)
      if (r !== 'wrong' || n >= TRIES) done(r === 'wrong' && almost ? 'half' : r)
    } catch (e) {
      setListening(false)
      const code = e instanceof ListenFailed ? e.code : 'failed'
      setError(LISTEN_ERRORS[code])
      if (code !== 'no-speech') setSelfRate(true)
    }
  }

  // Vor dem ersten Versuch verrät Anhören die Antwort, danach hilft es nur bei der Aussprache.
  const hear = () => {
    if (tries === 0) setHinted(true)
    speak(say, lang)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-500">Sag auf {languageLabel(lang)}:</p>
        <p className="mt-1 text-3xl font-semibold">{cue}</p>
        {(result || selfRate) && <p className="mt-3 text-xl font-bold text-indigo-600 dark:text-indigo-300">{say}</p>}
        {heard !== null && (
          <div className="mt-3 w-full max-w-60 text-sm text-slate-500">
            <p>
              Gehört: <span className="font-semibold text-slate-700 dark:text-slate-200">„{heard.text}“</span>
            </p>
            {heard.confidence > 0 && (
              <div className="mt-1.5" aria-label={`Deutlichkeit ${Math.round(heard.confidence * 100)} %`}>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${heard.confidence >= CLEAR ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.round(heard.confidence * 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs">Deutlichkeit {Math.round(heard.confidence * 100)} %</p>
              </div>
            )}
          </div>
        )}
        {almost && !result && (
          <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">Fast! Noch nicht ganz deutlich. Hör es dir an und versuch es nochmal.</p>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-amber-600 dark:text-amber-400">{error}</p>}
      </div>

      {result ? (
        <>
          {canSpeak() && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={`${button} flex items-center justify-center gap-2 py-2.5`} onClick={() => speak(say, lang)}>
                <Icon name="volume" className="size-5" /> Anhören
              </button>
              <button type="button" className={`${button} py-2.5`} onClick={() => speak(say, lang, 0.6)}>
                Langsam
              </button>
            </div>
          )}
          <Feedback result={result} solution={say} onNext={() => onResults([{ item, result }])} />
        </>
      ) : selfRate ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`${button} py-3`} onClick={() => done('wrong')}>
            Konnte ich nicht
          </button>
          <button type="button" className={`${button} py-3`} onClick={() => done('correct')}>
            Konnte ich
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={listening ? () => stop.current() : start}
            aria-label={listening ? 'Zuhören beenden' : 'Sprechen'}
            className={`mx-auto flex size-24 items-center justify-center rounded-full text-white shadow-lg transition ${
              listening ? 'animate-pulse bg-rose-500' : 'bg-indigo-600 active:scale-95'
            }`}
          >
            <Icon name="mic" className="size-11" />
          </button>
          <p className="-mt-2 text-center text-sm font-semibold text-slate-500">
            {listening ? 'Ich höre zu …' : tries > 0 ? `Nochmal versuchen (${tries} von ${TRIES})` : 'Tippen und sprechen'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {canSpeak() ? (
              <button type="button" className={`${button} flex items-center justify-center gap-1.5 py-2.5 text-sm`} onClick={hear}>
                <Icon name="volume" className="size-4" /> Vorsprechen
              </button>
            ) : (
              <span />
            )}
            {almost ? (
              <button type="button" className={`${button} py-2.5 text-sm`} onClick={() => done('half')}>
                Weiter
              </button>
            ) : (
              <button type="button" className={`${button} py-2.5 text-sm`} onClick={() => done('wrong')}>
                Weiß ich nicht
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
