import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { parsePairs, type ParseResult } from '../../import/parsePairs'
import { Section } from '../components'
import { ReviewList } from '../ReviewList'
import { button, input, muted, primary } from '../ui'

export function PasteImportPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [message, setMessage] = useState('')

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
    if (r.pairs.length === 0) setMessage('Keine Vokabelpaare erkannt. Pro Zeile: Wort, Trennzeichen, Übersetzung.')
    else setResult(r)
  }

  if (result) {
    return (
      <ReviewList
        lessonId={id}
        initial={result.pairs}
        skipped={result.skipped}
        onBack={() => setResult(null)}
        onSaved={() => navigate(`/lektion/${id}`, { replace: true })}
      />
    )
  }

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
