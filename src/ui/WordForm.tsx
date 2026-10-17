import { useState, type FormEvent } from 'react'
import type { WordInput } from '../data/types'
import { button, input, primary } from './ui'

export type WordFields = Pick<WordInput, 'term' | 'translation'> &
  Required<Pick<WordInput, 'example_sentence' | 'warning_note' | 'word_type'>>

const EMPTY: WordFields = { term: '', translation: '', example_sentence: '', warning_note: '', word_type: '' }

export function WordForm(props: {
  initial?: WordFields
  submitLabel: string
  onSubmit: (w: WordFields) => Promise<void>
  onCancel?: () => void
}) {
  const [w, setW] = useState<WordFields>(props.initial ?? EMPTY)
  const [more, setMore] = useState(Boolean(props.initial?.example_sentence || props.initial?.warning_note || props.initial?.word_type))
  const [busy, setBusy] = useState(false)
  const set = (k: keyof WordFields) => (e: { target: { value: string } }) => setW({ ...w, [k]: e.target.value })
  const valid = w.term.trim() && w.translation.trim()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    try {
      const clean = Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v.trim()])) as WordFields
      await props.onSubmit(clean)
      if (!props.initial) setW(EMPTY)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input className={input} placeholder="Begriff (Fremdsprache)" value={w.term} onChange={set('term')} autoCapitalize="off" />
      <input className={input} placeholder="Übersetzung" value={w.translation} onChange={set('translation')} />
      {more ? (
        <>
          <input className={input} placeholder="Beispielsatz" value={w.example_sentence} onChange={set('example_sentence')} />
          <input className={input} placeholder="Warnhinweis „Falscher Freund“" value={w.warning_note} onChange={set('warning_note')} />
          <input className={input} placeholder="Wortart (z. B. Verb)" value={w.word_type} onChange={set('word_type')} />
        </>
      ) : (
        <button type="button" className="text-sm text-indigo-600 dark:text-indigo-400" onClick={() => setMore(true)}>
          + Beispielsatz, Warnhinweis, Wortart
        </button>
      )}
      <div className="flex gap-2">
        <button type="submit" className={`${primary} flex-1 py-2`} disabled={!valid || busy}>
          {props.submitLabel}
        </button>
        {props.onCancel && (
          <button type="button" className={button} onClick={props.onCancel}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}
