import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { parsePairs, type ParsedPair } from '../../import/parsePairs'
import { useApp } from '../AppContext'
import { ErrorBox, Section } from '../components'
import { button, danger, input, muted, primary } from '../ui'

export function PasteImportPage() {
  const { id = '' } = useParams()
  const { store } = useApp()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [rows, setRows] = useState<ParsedPair[] | null>(null)
  const [skipped, setSkipped] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const fromClipboard = async () => {
    setMessage('')
    try {
      const t = await navigator.clipboard.readText()
      if (!t.trim()) setMessage('Die Zwischenablage ist leer.')
      else setText(t)
    } catch {
      setMessage('Zugriff auf die Zwischenablage nicht möglich. Bitte Text ins Feld einfügen (lange tippen → Einfügen).')
    }
  }

  const analyse = () => {
    const r = parsePairs(text)
    setRows(r.pairs)
    setSkipped(r.skipped)
    setMessage(r.pairs.length === 0 ? 'Keine Vokabelpaare erkannt. Pro Zeile: Wort, Trennzeichen, Übersetzung.' : '')
  }

  const valid = rows?.filter((r) => r.term.trim() && r.translation.trim()) ?? []

  const save = async () => {
    setBusy(true)
    try {
      for (const r of valid) {
        await store.createWord({ lesson_id: id, term: r.term.trim(), translation: r.translation.trim() })
      }
      navigate(`/lektion/${id}`, { replace: true })
    } catch {
      setMessage('Speichern fehlgeschlagen.')
      setBusy(false)
    }
  }

  if (rows === null) {
    return (
      <Section title="Vokabeln aus Text einfügen">
        <p className={`${muted} mb-3`}>
          Eine Vokabel pro Zeile, getrennt durch Tab, „=", „ - ", „;" oder mehrere Leerzeichen.
        </p>
        <textarea
          className={`${input} min-h-48 font-mono text-sm`}
          placeholder={'house = Haus\nto run - laufen'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {message && <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{message}</p>}
        <div className="mt-3 flex gap-2">
          <button type="button" className={button} onClick={fromClipboard}>
            Aus Zwischenablage
          </button>
          <button type="button" className={`${primary} flex-1 py-2`} disabled={!text.trim()} onClick={analyse}>
            Prüfen
          </button>
        </div>
      </Section>
    )
  }

  return (
    <div className="space-y-4">
      <Section title={`Prüfen (${valid.length})`}>
        {rows.length === 0 && <ErrorBox>{message}</ErrorBox>}
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex gap-2">
              <input
                className={`${input} px-2 text-sm`}
                value={r.term}
                aria-label="Begriff"
                onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, term: e.target.value } : x)))}
              />
              <input
                className={`${input} px-2 text-sm`}
                value={r.translation}
                aria-label="Übersetzung"
                onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, translation: e.target.value } : x)))}
              />
              <button
                type="button"
                className={danger}
                aria-label="Zeile entfernen"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        {skipped.length > 0 && (
          <div className="mt-3">
            <p className={muted}>Nicht erkannt ({skipped.length}):</p>
            <ul className="mt-1 text-sm text-slate-500">
              {skipped.map((s, i) => (
                <li key={i} className="truncate">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
      {message && rows.length > 0 && <ErrorBox>{message}</ErrorBox>}
      <div className="flex gap-2">
        <button type="button" className={button} onClick={() => setRows(null)}>
          Zurück
        </button>
        <button type="button" className={`${primary} flex-1`} disabled={valid.length === 0 || busy} onClick={save}>
          {valid.length} Wörter speichern
        </button>
      </div>
    </div>
  )
}
