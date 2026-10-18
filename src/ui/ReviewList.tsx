import { useState } from 'react'
import type { ScannedWord } from '../providers/types'
import { useApp } from './AppContext'
import { ErrorBox, Section } from './components'
import { button, danger, input, muted, primary, wordsLabel } from './ui'

const small = `${input} px-2 py-1 text-sm`

// Prüfansicht für erkannte oder eingefügte Vokabeln. Speichert gültige Zeilen in die Lektion.
export function ReviewList(props: {
  lessonId: string
  initial: ScannedWord[]
  skipped: string[]
  // Kleiner Hinweis, z. B. welcher Anbieter das Ergebnis geliefert hat.
  note?: string
  onBack: () => void
  onSaved: () => void
}) {
  const { store } = useApp()
  const [rows, setRows] = useState(props.initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const valid = rows.filter((r) => r.term.trim() && r.translation.trim())

  const set = (i: number, patch: Partial<ScannedWord>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const save = async () => {
    setBusy(true)
    setError(false)
    try {
      await store.createWords(
        valid.map((r) => ({
          lesson_id: props.lessonId,
          term: r.term.trim(),
          translation: r.translation.trim(),
          example_sentence: r.example_sentence?.trim() ?? '',
          warning_note: r.warning_note?.trim() ?? '',
          word_type: r.word_type?.trim() ?? '',
        })),
      )
      props.onSaved()
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Section title={`Prüfen (${valid.length})`}>
        {props.note && <p className="-mt-2 mb-2 text-xs text-slate-500">{props.note}</p>}
        {rows.length === 0 && <p className={muted}>Keine Vokabeln mehr in der Liste.</p>}
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((r, i) => (
            <li key={i} className="space-y-1 py-2">
              <div className="flex gap-2">
                <input className={small} value={r.term} aria-label="Begriff" onChange={(e) => set(i, { term: e.target.value })} />
                <input
                  className={small}
                  value={r.translation}
                  aria-label="Übersetzung"
                  onChange={(e) => set(i, { translation: e.target.value })}
                />
                <button
                  type="button"
                  className={danger}
                  aria-label="Zeile entfernen"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
              {r.example_sentence !== undefined && r.example_sentence !== '' && (
                <input
                  className={`${small} italic`}
                  value={r.example_sentence}
                  aria-label="Beispielsatz"
                  onChange={(e) => set(i, { example_sentence: e.target.value })}
                />
              )}
              {r.warning_note !== undefined && r.warning_note !== '' && (
                <input
                  className={`${small} text-amber-600 dark:text-amber-400`}
                  value={r.warning_note}
                  aria-label="Warnhinweis"
                  onChange={(e) => set(i, { warning_note: e.target.value })}
                />
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 text-sm text-indigo-600 dark:text-indigo-400"
          onClick={() => setRows([...rows, { term: '', translation: '' }])}
        >
          + Zeile
        </button>
        {props.skipped.length > 0 && (
          <div className="mt-3">
            <p className={muted}>Nicht erkannt ({props.skipped.length}):</p>
            <ul className="mt-1 text-sm text-slate-500">
              {props.skipped.map((s, i) => (
                <li key={i} className="truncate">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
      {error && <ErrorBox>Speichern fehlgeschlagen.</ErrorBox>}
      <div className="flex gap-2">
        <button type="button" className={button} onClick={props.onBack}>
          Zurück
        </button>
        <button type="button" className={`${primary} flex-1`} disabled={valid.length === 0 || busy} onClick={save}>
          {wordsLabel(valid.length)} speichern
        </button>
      </div>
    </div>
  )
}
