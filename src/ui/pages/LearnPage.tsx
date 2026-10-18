import { useCallback, useRef, useState } from 'react'
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
import { formatDay } from '../../learn/dates'
import { computeStats } from '../../learn/motivation'
import { wrongWordIds } from '../../learn/stats'
import { loadExam } from '../exam'
import { MODES, type ModeId } from '../../modes/modes'
import { LEARNING_MODES } from '../../modes/registry'
import type { ModeResult } from '../../modes/types'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { Confetti } from '../Confetti'
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
  const { store, profile, settings } = useApp()
  const [params] = useSearchParams()
  const errorsOnly = params.get('fehler') === '1'
  const examDate = params.get('arbeit')
  const [round, setRound] = useState<Round | null>(null)

  const [data] = useAsync(async () => {
    if (!profile) return null
    const lessons = await store.listLessons(profile.id)
    lessons.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const words = await Promise.all(lessons.map((l) => store.listWords(l.id)))
    const events = await store.listReviewEvents(profile.id)
    const wrong = errorsOnly ? wrongWordIds(events) : null
    const exam = examDate ? await loadExam(store, profile.id, examDate, settings.leitnerIntervals) : null
    return {
      states: computeStates(events),
      // Erst die heute noch offenen Karten, danach zum Nachüben alle geplanten.
      planKeys: exam ? (exam.plan.openToday > 0 ? exam.plan.openKeys : exam.plan.todayKeys) : undefined,
      preselected: exam ? exam.lessons.map((l) => l.id) : params.get('lektionen')?.split(',').filter(Boolean),
      lessons: lessons.map((lesson, i) => ({
        lesson,
        words: wrong ? words[i].filter((w) => wrong.has(w.id)) : words[i],
      })),
    }
  }, [store, profile, errorsOnly, examDate, settings.leitnerIntervals])

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
      preselected={data.data.preselected}
      planKeys={data.data.planKeys}
      examDate={examDate}
      onStart={(mode, items, pool) => setRound({ mode, session: startSession(items), pool })}
    />
  )
}

function Setup(props: {
  lessons: { lesson: Lesson; words: Word[] }[]
  states: Map<string, CardState>
  errorsOnly: boolean
  preselected?: string[]
  // Klassenarbeits-Plan: nur die heute geplanten Karten.
  planKeys?: Set<string>
  examDate?: string | null
  onStart: (mode: ModeId, items: StudyItem[], pool: Word[]) => void
}) {
  const { settings } = useApp()
  // Fehlerrunden und gezielt gewählte Lektionen fragen alles ab, sonst nur fällige Karten.
  const [dueOnly, setDueOnly] = useState(!props.errorsOnly && !props.preselected)
  const planKeys = props.planKeys
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(props.preselected ?? props.lessons.map((x) => x.lesson.id)),
  )
  const [dir, setDir] = useState<DirectionChoice>(planKeys ? 'both' : 'to_target')
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
  const inPlan = (i: StudyItem) => planKeys!.has(cardKey(i.word.id, i.direction))
  const items = buildItems(words, dir, { langs, filter: planKeys ? inPlan : dueOnly ? due : undefined })
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div className="space-y-4">
      {props.errorsOnly && <h2 className="text-lg font-semibold">Fehler wiederholen</h2>}
      {props.examDate && <h2 className="text-lg font-semibold">Klassenarbeit {formatDay(props.examDate)}: heute dran</h2>}
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
      {!planKeys && (
        <label className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            className="size-5 accent-indigo-600"
            checked={dueOnly}
            onChange={(e) => setDueOnly(e.target.checked)}
          />
          <span>Nur fällige Wörter</span>
        </label>
      )}
      {items.length === 0 && planKeys && (
        <p className={`${muted} px-1`}>Für heute ist im Plan nichts mehr offen.</p>
      )}
      {items.length === 0 && !planKeys && dueOnly && words.length > 0 && (
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
  // Ereignisse dieser Runde, um Fortschritt und Belohnung am Ende zu berechnen.
  const pending = useRef<Promise<unknown>[]>([])
  const saved = useRef(new Set<string>())
  const mode = LEARNING_MODES[round.mode]
  const { session } = round

  const onResults = useCallback(
    (results: ModeResult[]) => {
      let next = session
      for (const { item, result } of results) {
        next = answer(next, result)
        const saving = store
          .addReviewEvent({
            word_id: item.word.id,
            profile_id: profileId,
            direction: item.direction,
            mode: round.mode,
            result,
          })
          .then((e) => saved.current.add(e.id))
          .catch(() => setSaveError(true))
        pending.current.push(saving)
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
          <Reward profileId={profileId} pending={pending.current} saved={saved.current} allCorrect={s.wrong === 0} />
          {saveError && <p className="mt-2 text-sm text-rose-600">Einige Ergebnisse konnten nicht gespeichert werden.</p>}
        </Section>
        {wrong.length > 0 && (
          <button
            type="button"
            className={`${primary} w-full`}
            onClick={() => {
              pending.current = []
              saved.current = new Set()
              setRound({ ...round, session: startSession(shuffle(wrong)) })
            }}
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

// XP der Runde, Level-Aufstieg und Tagesziel. Vergleicht den Stand mit und ohne die Ereignisse dieser Runde.
function Reward(props: { profileId: string; pending: Promise<unknown>[]; saved: Set<string>; allCorrect: boolean }) {
  const { store, settings } = useApp()
  const [data] = useAsync(async () => {
    await Promise.allSettled(props.pending)
    const events = await store.listReviewEvents(props.profileId)
    const after = computeStats(events, settings.dailyGoal)
    const before = computeStats(
      events.filter((e) => !props.saved.has(e.id)),
      settings.dailyGoal,
    )
    return {
      xp: after.xp - before.xp,
      levelUp: after.level.level > before.level.level ? after.level.level : null,
      goal: after.todayWords >= settings.dailyGoal && before.todayWords < settings.dailyGoal,
    }
  }, [store, props.profileId, props.pending, props.saved, settings.dailyGoal])

  if (data.state !== 'ready') return null
  const { xp, levelUp, goal } = data.data
  return (
    <div className="mt-3 space-y-1">
      {(levelUp || goal || props.allCorrect) && xp > 0 && <Confetti />}
      <p className="font-semibold text-indigo-600 dark:text-indigo-400">+{xp} XP</p>
      {levelUp && <p className="font-semibold">Neues Level: {levelUp}!</p>}
      {goal && <p className="font-semibold text-emerald-600 dark:text-emerald-400">Tagesziel geschafft!</p>}
    </div>
  )
}
