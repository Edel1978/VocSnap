import { useEffect, useState } from 'react'
import { prompt, promptLang } from '../../learn/session'
import { AnswerInput } from '../shared/AnswerInput'
import { canSpeak, speak } from '../speech'
import type { ModeProps } from '../types'

// Das gefragte Wort wird vorgelesen statt angezeigt.
export function ListenWrite({ items, onResults }: ModeProps) {
  const item = items[0]
  const [show, setShow] = useState(!canSpeak())
  const say = () => speak(prompt(item), promptLang(item))

  useEffect(() => {
    say()
  }, [item])

  return (
    <AnswerInput items={items} onResults={onResults}>
      {canSpeak() ? (
        <button
          type="button"
          onClick={say}
          aria-label="Nochmal anhören"
          className="flex size-20 items-center justify-center rounded-full bg-indigo-600 text-4xl text-white"
        >
          🔊
        </button>
      ) : (
        <p className="mb-2 text-sm text-amber-600">Dieses Gerät hat keine Sprachausgabe.</p>
      )}
      {show ? (
        <p className="mt-4 text-2xl font-semibold">{prompt(item)}</p>
      ) : (
        <button type="button" className="mt-4 text-sm text-slate-500" onClick={() => setShow(true)}>
          Wort anzeigen
        </button>
      )}
    </AnswerInput>
  )
}
