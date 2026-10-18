import { useCallback, useEffect, useRef, useState } from 'react'
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
import { computeStats, rankOf } from '../../learn/motivation'
import { wrongWordIds } from '../../learn/stats'
import { loadExam } from '../exam'
import { MODES, modeEnabled, type ModeId } from '../../modes/modes'
import { LEARNING_MODES } from '../../modes/registry'
import type { ModeResult } from '../../modes/types'
import { useApp } from '../AppContext'
import { Empty, ErrorBox, Loading, PageTitle, Toggle } from '../components'
import { Confetti } from '../Confetti'
import { Mascot } from '../Mascot'
import { haptic } from '../haptics'
import { Icon, type IconName } from '../icons'
import { button, card, choice, chosen as chosenCls, muted, press, primary } from '../ui'
import { useAsync } from '../useAsync'

const DIRECTIONS: { value: DirectionChoice; label: string }[] = [
  { value: 'to_target', label: 'Fremdsprache → Deutsch' },
  { value: 'to_source', label: 'Deutsch → Fremdsprache' },
  { value: 'both', label: 'Beide Richtungen' },
]

// Aussehen der Lernmodi auf der Auswahlseite.
const MODE_LOOK: Record<ModeId, { icon: IconName; color: string; text: string }> = {
  flashcard: { icon: 'cards', color: '#6366F1', text: 'Umdrehen und selbst bewerten' },
  multiple_choice: { icon: 'list', color: '#F97316', text: 'Aus 4 Antworten wählen' },
  typing: { icon: 'keyboard', color: '#10B981', text: 'Antwort eintippen' },
  listen_write: { icon: 'ear', color: '#EC4899', text: 'Anhören und schreiben' },
  matching: { icon: 'puzzle', color: '#0EA5E9', text: 'Paare zuordnen' },
  speak: { icon: 'mic', color: '#8B5CF6', text: 'Wort ins Mikrofon sagen' },
}

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
  const quickStart = params.get('start') === '1'
  const [round, setRound] = useState<Round | null>(null)
  const started = useRef(false)

  const [data, reload] = useAsync(async () => {
    if (!profile) return null
    const lessons = await store.listLessons(profile.id)
    lessons.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const words = await Promise.all(lessons.map((l) => store.listWords(l.id)))
    const events = await store.listReviewEvents(profile.id)
    const wrong = errorsOnly ? wrongWordIds(events) : null
    const exam = examDate ? await loadExam(store, profile.id, examDate, settings.leitnerIntervals) : null
    const states = computeStates(events)
    // „Weiterlernen": sofort mit dem zuletzt gewählten Modus und allen fälligen Karten starten.
    let quick: Round | null = null
    if (quickStart) {
      const usable = (m: ModeId) => !!LEARNING_MODES[m] && modeEnabled(m, settings)
      const mode = usable(settings.learnMode) ? settings.learnMode : settings.modeOrder.find(usable)
      const lessonOf = new Map(lessons.map((l) => [l.id, l]))
      const pool = words.flat()
      const items = buildItems(pool, settings.learnDirection, {
        langs: (w) => ({ source: lessonOf.get(w.lesson_id)?.source_lang ?? '', target: lessonOf.get(w.lesson_id)?.target_lang ?? '' }),
        filter: (i) => isDue(states.get(cardKey(i.word.id, i.direction)), settings.leitnerIntervals),
      })
      if (mode && items.length > 0) quick = { mode, session: startSession(items), pool }
    }
    return {
      states,
      quick,
      // Erst die heute noch offenen Karten, danach zum Nachüben alle geplanten.
      planKeys: exam ? (exam.plan.openToday > 0 ? exam.plan.openKeys : exam.plan.todayKeys) : undefined,
      preselected: exam ? exam.lessons.map((l) => l.id) : params.get('lektionen')?.split(',').filter(Boolean),
      lessons: lessons.map((lesson, i) => ({
        lesson,
        words: wrong ? words[i].filter((w) => wrong.has(w.id)) : words[i],
      })),
    }
    // Nur beim Öffnen auswerten, nicht bei jeder Einstellungsänderung.
  }, [store, profile, errorsOnly, examDate, quickStart])

  useEffect(() => {
    if (!started.current && data.state === 'ready' && data.data?.quick) {
      started.current = true
      setRound(data.data.quick)
    }
  }, [data])

  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  if (data.state === 'loading') return <Loading />
  if (data.state === 'error' || !data.data) return <ErrorBox />

  if (round) {
    // Nach der Runde Lernstand neu laden, sonst zeigt die Auswahl noch die alten fälligen Karten.
    const changeRound = (r: Round | null) => {
      setRound(r)
      if (!r) reload()
    }
    return <RoundView profileId={profile.id} round={round} setRound={changeRound} />
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
  const { updateSettings } = useApp()
  const [dir, setDir] = useState<DirectionChoice>(planKeys ? 'both' : settings.learnDirection)
  const shownModes = settings.modeOrder.filter((m) => modeEnabled(m, settings))
  const available = shownModes.filter((m) => LEARNING_MODES[m])
  const [mode, setMode] = useState<ModeId | undefined>(
    available.includes(settings.learnMode) ? settings.learnMode : available[0],
  )

  if (props.lessons.length === 0) {
    return (
      <>
        <PageTitle title={props.errorsOnly ? 'Fehler wiederholen' : 'Lernen'} />
        {props.errorsOnly ? (
          <Empty mood="cheer" title="Keine offenen Fehler" text="Super, alles sitzt gerade!" />
        ) : (
          <Empty title="Noch keine Wörter" text="Leg zuerst eine Lektion mit Vokabeln an.">
            <Link to="/lektion/neu" className={`${primary} block`}>
              Neue Lektion
            </Link>
          </Empty>
        )}
      </>
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
  const start = (m: ModeId) => {
    if (items.length === 0) return
    setMode(m)
    if (!planKeys) updateSettings({ learnMode: m, learnDirection: dir })
    props.onStart(m, items, words)
  }
  const title = props.errorsOnly ? 'Fehler wiederholen' : props.examDate ? `Arbeit ${formatDay(props.examDate)}` : 'Lernen'
  const summaryText = [
    chosen.length === props.lessons.length ? 'Alle Lektionen' : `${chosen.length} von ${props.lessons.length} Lektionen`,
    DIRECTIONS.find((d) => d.value === dir)?.label,
    !planKeys && (dueOnly ? 'nur fällige' : 'alle Wörter'),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-4">
      <PageTitle title={title} />

      <section className="relative animate-pop rounded-[28px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-5 text-white shadow-[0_14px_30px_-12px_rgb(79_70_229/0.7)]">
        <Mascot mood={items.length === 0 ? 'cheer' : 'happy'} className="absolute -top-6 right-2 w-24 drop-shadow-lg" />
        <p className="text-xs font-extrabold tracking-widest text-indigo-200 uppercase">
          {planKeys ? 'Heute im Plan' : dueOnly ? 'Fällig' : 'Zum Üben'}
        </p>
        <p className="pr-24 font-display text-4xl leading-tight font-bold">
          {items.length > 0 ? `${items.length} ${items.length === 1 ? 'Abfrage' : 'Abfragen'}` : 'Alles erledigt'}
        </p>
        {items.length > 0 ? (
          <button type="button" data-tour="start-round" className={`${primary} mt-4 flex w-full items-center justify-center gap-2`} onClick={() => mode && start(mode)}>
            <Icon name="play" /> {MODES.find((m) => m.id === mode)?.label} starten
          </button>
        ) : (
          <p className="mt-2 text-sm text-indigo-100">
            {planKeys ? 'Für heute ist im Plan nichts mehr offen.' : 'Heute ist nichts fällig.'}
          </p>
        )}
        {items.length === 0 && !planKeys && dueOnly && words.length > 0 && (
          <button type="button" className={`${primary} mt-4 w-full`} onClick={() => setDueOnly(false)}>
            Trotzdem üben
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-2.5 text-xl font-semibold">Lernmodus wählen</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {shownModes.map((id, i) => {
            const meta = MODE_LOOK[id]
            const ready = Boolean(LEARNING_MODES[id])
            return (
              <button
                key={id}
                type="button"
                disabled={!ready || items.length === 0}
                onClick={() => start(id)}
                style={{ animationDelay: `${60 + i * 50}ms` }}
                className={`${card} ${press} flex animate-pop flex-col items-start gap-2 text-left disabled:opacity-50 ${
                  mode === id ? 'ring-3 ring-indigo-400' : ''
                } ${i === 0 && shownModes.length % 2 === 1 ? 'col-span-2 flex-row items-center' : ''}`}
              >
                <span className="flex size-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: meta.color }}>
                  <Icon name={meta.icon} />
                </span>
                <span>
                  <span className="block font-display text-lg leading-tight font-semibold">{MODES.find((m) => m.id === id)?.label}</span>
                  <span className={`${muted} block text-xs`}>{meta.text}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <details className={`${card} animate-pop group`}>
        <summary className="flex cursor-pointer list-none items-center gap-3">
          <Icon name="sliders" className="size-5 text-indigo-500" />
          <span className="flex-1">
            <span className="block font-bold">Anpassen</span>
            <span className={`${muted} block text-xs`}>{summaryText}</span>
          </span>
          <Icon name="chevron" className="size-5 text-slate-400 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-500">Lektionen</p>
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
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-500">Richtung</p>
            <div className="grid gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDir(d.value)}
                  className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${dir === d.value ? chosenCls : choice}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {!planKeys && <Toggle label="Nur fällige Wörter" checked={dueOnly} onChange={setDueOnly} />}
        </div>
      </details>
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
  // Richtige Antworten in Folge (halb zählt mit, falsch setzt zurück).
  const [combo, setCombo] = useState(0)

  const onResults = useCallback(
    (results: ModeResult[]) => {
      let next = session
      for (const { item, result } of results) {
        next = answer(next, result)
        setCombo((c) => (result === 'wrong' ? 0 : c + 1))
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
    const rate = (s.correct + s.half / 2) / Math.max(1, session.items.length)
    const stars = rate >= 0.9 ? 3 : rate >= 0.6 ? 2 : 1
    return (
      <div className="space-y-4 pt-2">
        <div className="flex flex-col items-center text-center">
          <Mascot mood={stars === 3 ? 'cheer' : 'happy'} className="w-32" />
          <div className="mt-1 flex gap-1" aria-label={`${stars} von 3 Sternen`}>
            {[1, 2, 3].map((n) => (
              <span key={n} className="animate-pop" style={{ animationDelay: `${300 + n * 180}ms` }}>
                <Icon
                  name="star"
                  className={`size-11 ${n <= stars ? 'fill-amber-300 text-amber-500' : 'fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700'}`}
                />
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-3xl font-bold">{stars === 3 ? 'Super gemacht!' : stars === 2 ? 'Gut gemacht!' : 'Weiter so!'}</h1>
          <p className={muted}>
            {s.correct} von {session.items.length} gewusst{s.half > 0 && `, ${s.half} fast`}
          </p>
        </div>
        <Reward profileId={profileId} pending={pending.current} saved={saved.current} allCorrect={s.wrong === 0} />
        {saveError && <ErrorBox>Einige Ergebnisse konnten nicht gespeichert werden.</ErrorBox>}
        {wrong.length > 0 && (
          <button
            type="button"
            className={`${primary} w-full`}
            onClick={() => {
              pending.current = []
              saved.current = new Set()
              setCombo(0)
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
          <Link to="/" data-tour="round-done" className={`${button} py-3 text-center`}>
            Fertig
          </Link>
        </div>
      </div>
    )
  }

  const batch = session.items.slice(session.index, session.index + mode.batchSize)
  const progress = session.index / session.items.length
  const last = session.results[session.results.length - 1]

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Runde abbrechen" className="-ml-1 flex size-9 items-center justify-center rounded-full text-slate-400" onClick={() => setRound(null)}>
          ✕
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-orange-400 transition-[width] duration-500" style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-500 tabular-nums">
          {session.index + 1}/{session.items.length}
        </span>
      </div>
      <div className="flex h-14 items-center gap-2">
        <Mascot mood={last === 'wrong' ? 'happy' : last ? 'cheer' : 'happy'} className="w-14" />
        {combo >= 3 ? (
          <span key={combo} className="flex animate-pop items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-extrabold text-orange-600 dark:bg-orange-950">
            <Icon name="flame" className="size-4" /> {combo} in Folge!
          </span>
        ) : (
          <span className={`${muted} font-semibold`}>{last === 'wrong' ? 'Nicht schlimm, weiter geht’s!' : last ? 'Weiter so!' : 'Los geht’s!'}</span>
        )}
      </div>
      <div key={session.index} data-tour="round" className="animate-slide">
        <mode.Component
          key={`${session.index}-${batch.map((i) => i.word.id + i.direction).join()}`}
          items={batch}
          pool={round.pool}
          settings={settings}
          onResults={onResults}
        />
      </div>
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

  const celebrate = data.state === 'ready' && (data.data.levelUp !== null || data.data.goal)
  useEffect(() => {
    if (celebrate) haptic.celebrate()
  }, [celebrate])

  if (data.state !== 'ready') return null
  const { xp, levelUp, goal } = data.data
  return (
    <div data-tour="reward" className="grid grid-cols-1 gap-2.5">
      {(levelUp || goal || props.allCorrect) && xp > 0 && <Confetti />}
      <div className={`${card} animate-pop flex items-center justify-between`}>
        <span className="font-bold text-slate-500">Erfahrung</span>
        <CountUp to={xp} className="font-display text-3xl font-bold text-indigo-600 dark:text-indigo-300" />
      </div>
      {levelUp && (
        <div className="animate-pop rounded-3xl bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 text-center font-display text-xl font-bold text-white">
          Neues Level: {levelUp}!
          {rankOf(levelUp) !== rankOf(levelUp - 1) && <span className="block text-base">Neuer Rang: {rankOf(levelUp)}</span>}
        </div>
      )}
      {goal && (
        <div className="animate-pop rounded-3xl bg-emerald-500 p-4 text-center font-display text-xl font-bold text-white">
          Tagesziel geschafft!
        </div>
      )}
    </div>
  )
}

// Zahl, die kurz hochzählt. Bei „Bewegung reduzieren" sofort der Endwert.
function CountUp({ to, className }: { to: number; className?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(to)
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900)
      setN(Math.round(to * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <span className={className}>+{n} XP</span>
}
