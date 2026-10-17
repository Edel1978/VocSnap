import { useState, type FormEvent } from 'react'
import { LANGUAGES } from '../config/languages'
import { input, primary } from './ui'

export interface LessonFields {
  title: string
  source_lang: string
  target_lang: string
}

export function LessonForm(props: { initial?: LessonFields; submitLabel: string; onSubmit: (l: LessonFields) => Promise<void> }) {
  const [l, setL] = useState<LessonFields>(props.initial ?? { title: '', source_lang: 'en', target_lang: 'de' })
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!l.title.trim()) return
    setBusy(true)
    try {
      await props.onSubmit({ ...l, title: l.title.trim() })
    } finally {
      setBusy(false)
    }
  }

  const select = (k: 'source_lang' | 'target_lang', label: string) => (
    <label className="flex-1 text-sm text-slate-500">
      {label}
      <select className={`${input} mt-1`} value={l[k]} onChange={(e) => setL({ ...l, [k]: e.target.value })}>
        {LANGUAGES.map((x) => (
          <option key={x.code} value={x.code}>
            {x.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className={input}
        placeholder="Titel, z. B. Unit 3"
        value={l.title}
        maxLength={60}
        onChange={(e) => setL({ ...l, title: e.target.value })}
      />
      <div className="flex gap-2">
        {select('source_lang', 'Fremdsprache')}
        {select('target_lang', 'Übersetzung in')}
      </div>
      <button type="submit" className={`${primary} w-full py-2`} disabled={!l.title.trim() || busy}>
        {props.submitLabel}
      </button>
    </form>
  )
}
