import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { languageColor, languageLabel } from '../../config/languages'
import type { Word } from '../../data/types'
import { exampleWords } from '../../data/examples'
import { lessonProgress } from '../../learn/progress'
import { directionsOf } from '../../learn/session'
import { BOXES, computeStates } from '../../learn/leitner'
import { useApp } from '../AppContext'
import { Empty, ErrorBox, Loading, PageTitle, Section } from '../components'
import { Emoji } from '../Emoji'
import { Icon } from '../icons'
import { LessonForm } from '../LessonForm'
import { button, card, danger, input, muted, primary, wordsLabel } from '../ui'
import { useAsync } from '../useAsync'
import { WordForm } from '../WordForm'

export function NewLessonPage() {
  const { store, profile } = useApp()
  const navigate = useNavigate()
  const weiter = useSearchParams()[0].get('weiter')
  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  return (
    <Section title="Neue Lektion">
      <div data-tour="lesson-form">
        <LessonForm
          submitLabel="Anlegen"
          onSubmit={async (l) => {
            const lesson = await store.createLesson({ ...l, profile_id: profile.id })
            // Aus dem Neu-Menü: direkt weiter zur KI-Wortliste.
            navigate(`/lektion/${lesson.id}${weiter === 'ki' ? '/ki' : ''}`, { replace: true })
          }}
        />
      </div>
    </Section>
  )
}

export function LessonPage() {
  const { id = '' } = useParams()
  const { store, profile, settings } = useApp()
  const navigate = useNavigate()
  const [editingLesson, setEditingLesson] = useState(false)
  const [editingWord, setEditingWord] = useState<string | null>(null)
  const [tab, setTab] = useState<'words' | 'add'>('words')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [data, reload] = useAsync(async () => {
    const lesson = await store.getLesson(id)
    const words = lesson ? await store.listWords(id) : []
    words.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const states = computeStates(profile ? await store.listReviewEvents(profile.id) : [])
    return { lesson, words, progress: lessonProgress(words, states, directionsOf(settings.learnDirection)) }
  }, [store, id, profile, settings.learnDirection])

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  const { lesson, words, progress } = data.data
  if (!lesson) return <ErrorBox>Diese Lektion gibt es nicht mehr.</ErrorBox>
  const color = languageColor(lesson.source_lang)
  const q = query.trim().toLowerCase()
  const examples = exampleWords(lesson.source_lang, lesson.target_lang)
  const shown = q ? words.filter((w) => `${w.term} ${w.translation}`.toLowerCase().includes(q)) : words

  return (
    <div className="space-y-4">
      <PageTitle title="" back="/">
        <button type="button" className={button} onClick={() => setEditingLesson((e) => !e)}>
          {editingLesson ? 'Schließen' : 'Bearbeiten'}
        </button>
      </PageTitle>

      {editingLesson ? (
        <Section title="Lektion bearbeiten">
          <div className="space-y-3">
            <LessonForm
              initial={lesson}
              submitLabel="Speichern"
              onSubmit={async (l) => {
                await store.updateLesson(lesson.id, l)
                setEditingLesson(false)
                reload()
              }}
            />
            <button
              type="button"
              className={danger}
              onClick={async () => {
                if (!confirm(`Lektion „${lesson.title}" mit allen Wörtern löschen?`)) return
                await store.deleteLesson(lesson.id)
                navigate('/', { replace: true })
              }}
            >
              Lektion löschen
            </button>
          </div>
        </Section>
      ) : (
        <section
          className="-mt-2 animate-pop rounded-[28px] p-5 text-white shadow-[0_14px_30px_-12px_rgb(0_0_0/0.35)]"
          style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, #1e1b4b))` }}
        >
          <p className="text-xs font-extrabold tracking-widest uppercase opacity-80">
            {languageLabel(lesson.source_lang)} → {languageLabel(lesson.target_lang)}
          </p>
          <h1 className="mt-1 text-3xl leading-tight font-bold">{lesson.title}</h1>
          <p className="mt-1 text-sm opacity-90">
            {wordsLabel(words.length)} · {progress.safePct} % sicher
          </p>
          {words.length > 0 && (
            <>
              <div className="mt-3 flex h-2.5 gap-1 overflow-hidden rounded-full" aria-hidden="true">
                {progress.fresh > 0 && <span className="rounded-full bg-rose-300" style={{ flex: progress.fresh }} />}
                {progress.wobbly > 0 && <span className="rounded-full bg-amber-300" style={{ flex: progress.wobbly }} />}
                {progress.safe > 0 && <span className="rounded-full bg-emerald-300" style={{ flex: progress.safe }} />}
              </div>
              <p className="mt-1.5 text-xs opacity-90">
                {progress.fresh} neu · {progress.wobbly} wackelig · {progress.safe} sicher
              </p>
            </>
          )}
          {words.length > 0 && (
            <Link to={`/lernen?lektionen=${lesson.id}`} data-tour="learn-lesson" className={`${primary} mt-4 flex items-center justify-center gap-2`}>
              <Emoji name="rocket" /> Diese Lektion lernen
            </Link>
          )}
        </section>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800" role="tablist">
        {(['words', 'add'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            data-tour={t === 'add' ? 'add-tab' : undefined}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 text-sm font-bold transition ${
              tab === t ? 'bg-white text-indigo-700 shadow-card dark:bg-slate-900 dark:text-indigo-300' : 'text-slate-500'
            }`}
          >
            {t === 'words' ? `Wörter (${words.length})` : 'Hinzufügen'}
          </button>
        ))}
      </div>

      {tab === 'add' ? (
        <div data-tour="add-ways" className="space-y-4">
          {examples && words.length === 0 && (
            <button
              type="button"
              className={`${button} flex w-full items-center justify-center gap-2 py-3`}
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await store.createWords(examples.map((w) => ({ ...w, lesson_id: lesson.id })))
                  setTab('words')
                  reload()
                } catch {
                  setSaveError(true)
                } finally {
                  setBusy(false)
                }
              }}
            >
              <Emoji name="sparkles" className="size-6" /> Mit Beispielwörtern ausprobieren
            </button>
          )}
          {saveError && <ErrorBox>Die Beispielwörter konnten nicht gespeichert werden.</ErrorBox>}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['scan', 'camera', 'Foto', 'bg-sky-100 dark:bg-sky-950'],
                ['ki', 'sparkles', 'Mit KI', 'bg-orange-100 dark:bg-orange-950'],
                ['einfuegen', 'memo', 'Liste', 'bg-emerald-100 dark:bg-emerald-950'],
              ] as const
            ).map(([path, emoji, label, bg]) => (
              <Link key={path} to={`/lektion/${lesson.id}/${path}`} className={`${card} flex flex-col items-center gap-1.5 py-3 text-sm font-bold`}>
                <span className={`flex size-12 items-center justify-center rounded-2xl ${bg}`}>
                  <Emoji name={emoji} className="size-8" />
                </span>
                {label}
              </Link>
            ))}
          </div>
          <Section title="Von Hand eintragen">
            <WordForm
              submitLabel="Hinzufügen"
              onSubmit={async (w) => {
                await store.createWord({ ...w, lesson_id: lesson.id })
                reload()
              }}
            />
          </Section>
        </div>
      ) : words.length === 0 ? (
        <Empty title="Noch keine Wörter" text="Scanne eine Seite, füge Text ein oder trag Wörter von Hand ein.">
          <button type="button" className={`${primary} w-full`} onClick={() => setTab('add')}>
            Wörter hinzufügen
          </button>
        </Empty>
      ) : (
        <section className={`${card} animate-pop`}>
          <label className="relative mb-2 block">
            <Icon name="search" className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
            <input className={`${input} pl-10`} placeholder="Suchen" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {shown.map((w) =>
              editingWord === w.id ? (
                <li key={w.id} className="py-3">
                  <WordForm
                    initial={w}
                    submitLabel="Speichern"
                    onCancel={() => setEditingWord(null)}
                    onSubmit={async (patch) => {
                      await store.updateWord(w.id, patch)
                      setEditingWord(null)
                      reload()
                    }}
                  />
                  <button
                    type="button"
                    className={`${danger} mt-1`}
                    onClick={async () => {
                      if (!confirm(`„${w.term}" löschen?`)) return
                      await store.deleteWord(w.id)
                      setEditingWord(null)
                      reload()
                    }}
                  >
                    Wort löschen
                  </button>
                </li>
              ) : (
                <WordRow
                  key={w.id}
                  word={w}
                  box={progress.boxOf.get(w.id) ?? 0}
                  onEdit={() => setEditingWord(w.id)}
                />
              ),
            )}
          </ul>
          {shown.length === 0 && <p className={`${muted} py-3 text-center`}>Nichts gefunden.</p>}
        </section>
      )}
    </div>
  )
}

// Punkte zeigen, wie sicher das Wort sitzt (Fach 1–5).

// Fach als Farbpunkt: rot neu, gelb wackelig (Fach 1–2), grün sicher (ab Fach 3). Antippen öffnet Bearbeiten (dort auch Löschen).
function WordRow({ word, box, onEdit }: { word: Word; box: number; onEdit: () => void }) {
  const dot = box === 0 ? 'bg-rose-400' : box <= 2 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <li>
      <button type="button" className="flex w-full items-center gap-3 py-2.5 text-left" onClick={onEdit} title={box ? `Fach ${box} von ${BOXES}` : 'Noch nicht gelernt'}>
        <span className={`size-2.5 shrink-0 rounded-full ${dot}`} aria-label={box ? `Fach ${box}` : 'neu'} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{word.term}</span>
          <span className={`block truncate ${muted}`}>{word.translation}</span>
        </span>
        <Icon name="chevron" className="size-4 text-slate-300" />
      </button>
    </li>
  )
}
