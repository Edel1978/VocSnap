import { useState, type FormEvent, type ReactNode } from 'react'
import type { ReviewResult } from '../../data/types'
import { solution } from '../../learn/session'
import { grade } from '../../learn/tolerance'
import type { ModeProps } from '../types'
import { Extras } from './Extras'
import { Feedback } from './Feedback'

// Eingabe mit Fehlertoleranz, gemeinsam für Tippen und Hören und Schreiben.
export function AnswerInput({ items, onResults, children }: Pick<ModeProps, 'items' | 'onResults'> & { children: ReactNode }) {
  const item = items[0]
  const [value, setValue] = useState('')
  const [result, setResult] = useState<ReviewResult | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (result) return
    setResult(grade(value, solution(item)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          autoFocus
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg dark:border-slate-700 dark:bg-slate-800"
          placeholder="Antwort eintippen"
          value={value}
          readOnly={result !== null}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
        />
        {!result && (
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 font-semibold text-white" disabled={!value.trim()}>
            OK
          </button>
        )}
      </form>
      {!result && (
        <button type="button" className="text-sm text-slate-500" onClick={() => setResult('wrong')}>
          Weiß ich nicht
        </button>
      )}
      {result && (
        <>
          <Feedback result={result} solution={solution(item)} onNext={() => onResults([{ item, result }])} />
          <Extras word={item.word} />
        </>
      )}
    </div>
  )
}
