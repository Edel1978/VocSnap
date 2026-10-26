import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { languageLabel } from '../../config/languages'
import { GENERATE_COUNTS, GENERATE_MAX_TEXT, PROVIDERS } from '../../config/providers'
import { ChainError, hasKey, runGenerate } from '../../providers/chain'
import { createProvider } from '../../providers/registry'
import { SCAN_ERROR_TEXT, type GenerateLevel, type ScannedWord } from '../../providers/types'
import { useApp } from '../AppContext'
import { Choice, ErrorBox, Loading, Section } from '../components'
import { Mascot } from '../Mascot'
import { ReviewList } from '../ReviewList'
import { button, input, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

type Mode = 'topic' | 'text'

// KI-Wortliste zu einer Situation oder aus einem fremdsprachigen Text, danach Prüfliste wie beim Scan.
export function GeneratePage() {
  const { id = '' } = useParams()
  const { store, settings, updateSettings } = useApp()
  const navigate = useNavigate()
  const [lesson] = useAsync(() => store.getLesson(id), [store, id])
  const [mode, setMode] = useState<Mode>('topic')
  const [text, setText] = useState('')
  const [count, setCount] = useState(String(GENERATE_COUNTS[1]))
  const [level, setLevel] = useState<GenerateLevel>('easy')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[] | null>(null)
  const [words, setWords] = useState<{ list: ScannedWord[]; note: string } | null>(null)

  if (lesson.state === 'loading') return <Loading />
  if (lesson.state === 'error') return <ErrorBox />
  if (!lesson.data) return <ErrorBox>Diese Lektion gibt es nicht mehr.</ErrorBox>
  const { source_lang, target_lang } = lesson.data
  const usable = settings.providerOrder.filter((p) => PROVIDERS[p].generates && hasKey(p, settings.apiKeys))

  if (words) {
    return (
      <ReviewList
        lessonId={id}
        initial={words.list}
        skipped={[]}
        note={words.note}
        onBack={() => confirm('Erstellte Wörter verwerfen?') && setWords(null)}
        onSaved={() => navigate(`/lektion/${id}`, { replace: true })}
      />
    )
  }

  const generate = async () => {
    setBusy(true)
    setErrors(null)
    const invalid = new Set(settings.invalidKeys)
    try {
      const { result, attempts } = await runGenerate(
        settings.providerOrder,
        settings.apiKeys,
        { mode, input: text, sourceLang: source_lang, targetLang: target_lang, count: Number(count), level },
        { create: createProvider },
      )
      attempts.forEach((a) => (a.error === 'invalid_key' ? invalid.add(a.provider) : !a.error && invalid.delete(a.provider)))
      const used = attempts.find((a) => !a.error)
      if (result.length === 0) setErrors(['Dazu wurden keine passenden Wörter gefunden. Versuch es mit einer anderen Beschreibung.'])
      else setWords({ list: result, note: `Erstellt mit ${used ? PROVIDERS[used.provider].label : 'KI'}. Bitte prüfen, KI kann sich irren.` })
    } catch (e) {
      const attempts = e instanceof ChainError ? e.attempts : []
      attempts.forEach((a) => a.error === 'invalid_key' && invalid.add(a.provider))
      setErrors(['Die Wortliste konnte nicht erstellt werden.', ...attempts.map((a) => `${PROVIDERS[a.provider].label}: ${a.message ?? SCAN_ERROR_TEXT[a.error ?? 'failed']}`)])
    } finally {
      updateSettings({ invalidKeys: [...invalid] })
      setBusy(false)
    }
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setText((await file.text()).slice(0, GENERATE_MAX_TEXT))
    } catch {
      setErrors(['Die Datei konnte nicht gelesen werden.'])
    }
  }

  if (busy) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Mascot mood="happy" className="w-32 animate-bob" />
        <p className="mt-3 font-display text-xl font-semibold">Snappy sucht passende Wörter …</p>
        <p className={muted}>Das dauert ein paar Sekunden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Section title="Mit KI erstellen">
        <div className="space-y-3">
          <Choice<Mode>
            value={mode}
            options={[
              { value: 'topic', label: 'Situation' },
              { value: 'text', label: 'Aus Text' },
            ]}
            onChange={setMode}
          />
          <p className={muted}>
            {mode === 'topic'
              ? `Beschreibe, wofür du ${languageLabel(source_lang)} brauchst. Die KI stellt die passenden Wörter zusammen.`
              : `Füge einen Text auf ${languageLabel(source_lang)} ein, z. B. einen Liedtext oder Artikel. Die KI sucht die Wörter heraus, die für dich neu sind.`}
          </p>
          <textarea
            className={`${input} ${mode === 'text' ? 'min-h-48' : 'min-h-24'}`}
            placeholder={mode === 'topic' ? 'z. B. Arztbesuch im Urlaub, Wohnung besichtigen, Fußballtraining' : 'Text hier einfügen'}
            maxLength={GENERATE_MAX_TEXT}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {mode === 'text' && (
            <label className={`${button} block cursor-pointer py-2.5 text-center`}>
              Textdatei öffnen (.txt)
              <input type="file" accept=".txt,text/plain" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
            </label>
          )}
          <div>
            <p className="mb-1 text-sm font-bold text-slate-500">{mode === 'topic' ? 'Anzahl Wörter' : 'Höchstens'}</p>
            <Choice value={count} options={GENERATE_COUNTS.map((n) => ({ value: String(n), label: String(n) }))} onChange={setCount} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-slate-500">Niveau</p>
            <Choice<GenerateLevel>
              value={level}
              options={[
                { value: 'easy', label: 'Anfänger' },
                { value: 'medium', label: 'Mittel' },
                { value: 'advanced', label: 'Fortgeschritten' },
              ]}
              onChange={setLevel}
            />
          </div>
        </div>
      </Section>

      {usable.length === 0 ? (
        <ErrorBox>
          Dafür brauchst du einen Key für Groq oder Gemini.{' '}
          <Link to="/einstellungen/scan" className="font-bold underline">
            Key eintragen
          </Link>
        </ErrorBox>
      ) : (
        <button type="button" className={`${primary} w-full`} disabled={text.trim().length < 3} onClick={generate}>
          Wortliste erstellen
        </button>
      )}
      {errors && (
        <ErrorBox>
          {errors.map((e) => (
            <span key={e} className="block">
              {e}
            </span>
          ))}
        </ErrorBox>
      )}
      <p className={`${muted} px-1 text-xs`}>
        Deine Eingabe wird zur Verarbeitung an {usable.map((p) => PROVIDERS[p].label).join(' bzw. ') || 'den Anbieter'} gesendet. Braucht Internet.
      </p>
    </div>
  )
}
