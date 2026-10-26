import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { languageColor, languageLabel } from '../../config/languages'
import type { Direction, Word } from '../../data/types'
import { exampleWords } from '../../data/examples'
import { BOXES, boxOf, cardKey, computeStates } from '../../learn/leitner'
import { useApp } from '../AppContext'
import { Empty, ErrorBox, Loading, PageTitle, Section } from '../components'
import { Icon } from '../icons'
import { LessonForm } from '../LessonForm'
import { button, card, danger, input, muted, primary, wordsLabel } from '../ui'
import { useAsync } from '../useAsync'
import { WordForm } from '../WordForm'

const DIRS: Direction[] = ['to_target', 'to_source']

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
  const { store, profile } = useApp()
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
    // Fach je Wort: das schwächere der beiden Richtungen.
    const boxOfWord = new Map(words.map((w) => [w.id, Math.min(...DIRS.map((d) => boxOf(states.get(cardKey(w.id, d)))))]))
    const safe = words.reduce((n, w) => n + DIRS.filter((d) => (states.get(cardKey(w.id, d))?.box ?? 0) >= 3).length, 0)
    return { lesson, words, boxOfWord, safe: words.length ? Math.round((safe / (words.length * 2)) * 100) : 0 }
  }, [store, id, profile])

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  const { lesson, words, boxOfWord, safe } = data.data
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
            {wordsLabel(words.length)} · {safe} % sicher
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${safe}%` }} />
          </div>
          {words.length > 0 && (
            <Link to={`/lernen?lektionen=${lesson.id}`} data-tour="learn-lesson" className={`${primary} mt-4 flex items-center justify-center gap-2`}>
              <Icon name="play" /> Diese Lektion lernen
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
              <Icon name="sparkle" className="size-5 text-orange-500" /> Mit Beispielwörtern ausprobieren
            </button>
          )}
          {saveError && <ErrorBox>Die Beispielwörter konnten nicht gespeichert werden.</ErrorBox>}
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/lektion/${lesson.id}/scan`} className={`${button} flex items-center justify-center gap-2 py-3`}>
              <Icon name="camera" className="size-5" /> Foto scannen
            </Link>
            <Link to={`/lektion/${lesson.id}/einfuegen`} className={`${button} flex items-center justify-center gap-2 py-3`}>
              <Icon name="list" className="size-5" /> Liste einfügen
            </Link>
            <Link to={`/lektion/${lesson.id}/ki`} className={`${button} col-span-2 flex items-center justify-center gap-2 py-3`}>
              <Icon name="sparkle" className="size-5 text-orange-500" /> Mit KI erstellen: Situation oder Text
            </Link>
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
                </li>
              ) : (
                <WordRow
                  key={w.id}
                  word={w}
                  box={boxOfWord.get(w.id) ?? 1}
                  onEdit={() => setEditingWord(w.id)}
                  onDelete={async () => {
                    await store.deleteWord(w.id)
                    reload()
                  }}
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
function BoxDots({ box }: { box: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Fach ${box} von ${BOXES}`} title={`Fach ${box}`}>
      {Array.from({ length: BOXES }, (_, i) => (
        <span key={i} className={`size-1.5 rounded-full ${i < box ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
      ))}
    </span>
  )
}

function WordRow({ word, box, onEdit, onDelete }: { word: Word; box: number; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-2 py-2.5">
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <span className="block truncate font-medium">{word.term}</span>
        <span className={`block truncate ${muted}`}>{word.translation}</span>
      </button>
      <BoxDots box={box} />
      <button
        type="button"
        className={danger}
        aria-label={`${word.term} löschen`}
        onClick={() => {
          if (confirm(`„${word.term}" löschen?`)) onDelete()
        }}
      >
        ✕
      </button>
    </li>
  )
}
