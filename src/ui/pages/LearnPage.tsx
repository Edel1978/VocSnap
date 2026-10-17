import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Lesson, Word } from '../../data/types'
import {
  answer,
  buildItems,
  isFinished,
  shuffle,
  startSession,
  summary,
  wrongItems,
  type DirectionChoice,
  type SessionState,
  type StudyItem,
} from '../../learn/session'
import { cardKey, computeStates, isDue, type CardState } from '../../learn/leitner'
import { wrongWordIds } from '../../learn/stats'
import { MODES, type ModeId } from '../../modes/modes'
import { LEARNING_MODES } from '../../modes/registry'
import type { ModeResult } from '../../modes/types'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { button, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

const DIRECTIONS: { value: DirectionChoice; label: string }[] = [
  { value: 'to_target', label: 'Fremdsprache → Deutsch' },
  { value: 'to_source', label: 'Deutsch → Fremdsprache' },
  { value: 'both', label: 'Beide Richtungen' },
]

interface Round {
  mode: ModeId
  session: SessionState
  pool: Word[]
}

// Neu einhängen, wenn sich die Adresse ändert (z. B. von „Fehler wiederholen" zu „Lernen").
export function LearnPage() {
  const [params] = useSearchParams()
  return <Learn key={params.toString()} />
}

function Learn() {
  const { store, profile } = useApp()
  const [params] = useSearchParams()
  const errorsOnly = params.get('fehler') === '1'
  const preselected = params.get('lektionen')?.split(',').filter(Boolean)
  const [round, setRound] = useState<Round | null>(null)

  const [data] = useAsync(async () => {
    if (!profile) return null
    const lessons = await store.listLessons(profile.id)
    lessons.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const words = await Promise.all(lessons.map((l) => store.listWords(l.id)))
    const events = await store.listReviewEvents(profile.id)
    const wrong = errorsOnly ? wrongWordIds(events) : null
    return {
      states: computeStates(events),
      lessons: lessons.map((lesson, i) => ({
        lesson,
        words: wrong ? words[i].filter((w) => wrong.has(w.id)) : words[i],
      })),
    }
  }, [store, profile, errorsOnly])

  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  if (data.state === 'loading') return <Loading />
  if (data.state === 'error' || !data.data) return <ErrorBox />

  if (round) {
    return <RoundView profileId={profile.id} round={round} setRound={setRound} />
  }

  return (
    <Setup
      lessons={data.data.lessons.filter((x) => x.words.length > 0)}
      states={data.data.states}
      errorsOnly={errorsOnly}
      preselected={preselected}
      onStart={(mode, items, pool) => setRound({ mode, session: startSession(items), pool })}
    />
  )
}

function Setup(props: {
  lessons: { lesson: Lesson; words: Word[] }[]
  states: Map<string, CardState>
  errorsOnly: boolean
  preselected?: string[]
  onStart: (mode: ModeId, items: StudyItem[], pool: Word[]) => void
}) {
  const { settings } = useApp()
  // Fehlerrunden und gezielt gewählte Lektionen fragen alles ab, sonst nur fällige Karten.
  const [dueOnly, setDueOnly] = useState(!props.errorsOnly && !props.preselected)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(props.preselected ?? props.lessons.map((x) => x.lesson.id)),
  )
  const [dir, setDir] = useState<DirectionChoice>('to_target')
  const available = settings.modeOrder.filter((m) => LEARNING_MODES[m])
  const [mode, setMode] = useState<ModeId | undefined>(available[0])

  if (props.lessons.length === 0) {
    return (
      <Section title={props.errorsOnly ? 'Fehler wiederholen' : 'Lernen'}>
        <p className={muted}>
          {props.errorsOnly ? 'Keine offenen Fehler. Super!' : 'Noch keine Wörter. Leg zuerst eine Lektion mit Vokabeln an.'}
        </p>
        <Link to="/" className={`${button} mt-3 inline-block`}>
          Zur Startseite
        </Link>
      </Section>
    )
  }

  const chosen = props.lessons.filter((x) => selected.has(x.lesson.id))
  const words = chosen.flatMap((x) => x.words)
  const lessonOf = new Map(props.lessons.map((x) => [x.lesson.id, x.lesson]))
  const langs = (w: Word) => {
    const l = lessonOf.get(w.lesson_id)
    return { source: l?.source_lang ?? '', target: l?.target_lang ?? '' }
  }
  const due = (i: StudyItem) => isDue(props.states.get(cardKey(i.word.id, i.direction)), settings.leitnerIntervals)
  const items = buildItems(words, dir, { langs, filter: dueOnly ? due : undefined })
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div className="space-y-4">
      {props.errorsOnly && <h2 className="text-lg font-semibold">Fehler wiederholen</h2>}
      <Section title="Lektionen">
        <ul className="space-y-1">
          {props.lessons.map(({ lesson, words }) => (
            <li key={lesson.id}>
              <label className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  className="size-5 accent-indigo-600"
                  checked={selected.has(lesson.id)}
                  onChange={() => toggle(lesson.id)}
                />
                <span className="flex-1">{lesson.title}</span>
                <span className={muted}>{words.length}</span>
              </label>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Richtung">
        <div className="grid gap-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDir(d.value)}
              className={`rounded-lg px-3 py-2 text-left ${
                dir === d.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Lernmodus">
        <div className="grid gap-2">
          {settings.modeOrder.map((id) => {
            const ready = Boolean(LEARNING_MODES[id])
            return (
              <button
                key={id}
                type="button"
                disabled={!ready}
                onClick={() => setMode(id)}
                className={`rounded-lg px-3 py-2 text-left disabled:opacity-40 ${
                  mode === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {MODES.find((m) => m.id === id)?.label}
                {!ready && <span className="ml-2 text-sm">(folgt)</span>}
              </button>
            )
          })}
        </div>
      </Section>
      <label className="flex items-center gap-3 px-1">
        <input
          type="checkbox"
          className="size-5 accent-indigo-600"
          checked={dueOnly}
          onChange={(e) => setDueOnly(e.target.checked)}
        />
        <span>Nur fällige Wörter</span>
      </label>
      {items.length === 0 && dueOnly && words.length > 0 && (
        <p className={`${muted} px-1`}>Heute ist hier nichts fällig. Haken entfernen, um trotzdem zu üben.</p>
      )}
      <button
        type="button"
        className={`${primary} w-full`}
        disabled={items.length === 0 || !mode}
        onClick={() => mode && props.onStart(mode, items, words)}
      >
        Start ({items.length} {items.length === 1 ? 'Abfrage' : 'Abfragen'})
      </button>
    </div>
  )
}

function RoundView({
  profileId,
  round,
  setRound,
}: {
  profileId: string
  round: Round
  setRound: (r: Round | null) => void
}) {
  const { store, settings } = useApp()
  const [saveError, setSaveError] = useState(false)
  const mode = LEARNING_MODES[round.mode]
  const { session } = round

  const onResults = useCallback(
    (results: ModeResult[]) => {
      let next = session
      for (const { item, result } of results) {
        next = answer(next, result)
        store
          .addReviewEvent({
            word_id: item.word.id,
            profile_id: profileId,
            direction: item.direction,
            mode: round.mode,
            result,
          })
          .catch(() => setSaveError(true))
      }
      setRound({ ...round, session: next })
    },
    [session, store, profileId, round, setRound],
  )

  if (!mode) return <ErrorBox>Dieser Lernmodus ist nicht verfügbar.</ErrorBox>

  if (isFinished(session)) {
    const s = summary(session)
    const wrong = wrongItems(session)
    return (
      <div className="space-y-4">
        <Section title="Runde beendet">
          <p className="text-lg">
            {s.correct} von {session.items.length} gewusst
          </p>
          {s.wrong === 0 && <p className="mt-1 text-emerald-600 dark:text-emerald-400">Alles richtig!</p>}
          {saveError && <p className="mt-2 text-sm text-rose-600">Einige Ergebnisse konnten nicht gespeichert werden.</p>}
        </Section>
        {wrong.length > 0 && (
          <button
            type="button"
            className={`${primary} w-full`}
            onClick={() => setRound({ ...round, session: startSession(shuffle(wrong)) })}
          >
            Fehler wiederholen ({wrong.length})
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`${button} py-3`} onClick={() => setRound(null)}>
            Neue Runde
          </button>
          <Link to="/" className={`${button} py-3 text-center`}>
            Fertig
          </Link>
        </div>
      </div>
    )
  }

  const batch = session.items.slice(session.index, session.index + mode.batchSize)
  const progress = session.index / session.items.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className={muted}>
          {session.index + 1}/{session.items.length}
        </span>
        <button type="button" className={button} onClick={() => setRound(null)}>
          Abbrechen
        </button>
      </div>
      <mode.Component
        key={`${session.index}-${batch.map((i) => i.word.id + i.direction).join()}`}
        items={batch}
        pool={round.pool}
        settings={settings}
        onResults={onResults}
      />
    </div>
  )
}
