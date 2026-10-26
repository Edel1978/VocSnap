import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addDays, formatDay, isoDay } from '../../learn/dates'
import { useApp } from '../AppContext'
import type { Exam, ExamKind, Lesson, Word } from '../../data/types'
import { Choice, ErrorBox, Loading, Section, Toggle } from '../components'
import { EXAM_LABEL, loadExam } from '../exam'
import { button, danger, input, muted, primary, wordsLabel } from '../ui'
import { useAsync } from '../useAsync'

// Neue Prüfung planen (?art=test|klassenarbeit) oder bestehende ändern (:id).
export function ExamEditPage() {
  const { id } = useParams()
  const { store, profile } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [data] = useAsync(async () => {
    const list = profile ? await store.listLessons(profile.id) : []
    list.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const words = new Map(await Promise.all(list.map(async (l) => [l.id, await store.listWords(l.id)] as const)))
    return { lessons: list, words, exam: id ? await store.getExam(id) : undefined }
  }, [store, profile, id])

  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  if (id && !data.data.exam) return <ErrorBox>Diese Prüfung gibt es nicht mehr.</ErrorBox>
  return (
    <ExamForm
      key={id ?? 'neu'}
      profileId={profile.id}
      exam={data.data.exam}
      kind={params.get('art') === 'klassenarbeit' ? 'klassenarbeit' : 'test'}
      lessons={data.data.lessons}
      words={data.data.words}
      onDone={(to) => navigate(to, { replace: true })}
    />
  )
}

function ExamForm(props: {
  profileId: string
  exam?: Exam
  kind: ExamKind
  lessons: Lesson[]
  words: Map<string, Word[]>
  onDone: (to: string) => void
}) {
  const { store } = useApp()
  const { exam } = props
  const today = isoDay()
  const [kind, setKind] = useState<ExamKind>(exam?.kind ?? props.kind)
  const [date, setDate] = useState(exam?.date ?? isoDay(addDays(new Date(), kind === 'test' ? 3 : 7)))
  const [chosen, setChosen] = useState(new Set(exam?.lesson_ids ?? []))
  // null = alle Wörter der gewählten Lektionen.
  const [picked, setPicked] = useState<Set<string> | null>(exam?.word_ids ? new Set(exam.word_ids) : null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const label = EXAM_LABEL[kind]
  const chosenWords = props.lessons.filter((l) => chosen.has(l.id)).flatMap((l) => props.words.get(l.id) ?? [])
  const wordIds = picked ? chosenWords.filter((w) => picked.has(w.id)).map((w) => w.id) : null

  const flip = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }

  const save = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const fields = { kind, date, lesson_ids: [...chosen], word_ids: wordIds }
      const saved = exam ? await store.updateExam(exam.id, fields) : await store.createExam({ ...fields, profile_id: props.profileId })
      props.onDone(`/pruefung/${saved.id}`)
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!exam || !confirm(`${label} löschen? Die Lektionen bleiben erhalten.`)) return
    try {
      await store.deleteExam(exam.id)
      props.onDone('/')
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="space-y-4">
      <Section title={exam ? `${label} ändern` : `${label} planen`}>
        <div className="space-y-3">
          <Choice<ExamKind>
            value={kind}
            options={[
              { value: 'test', label: EXAM_LABEL.test },
              { value: 'klassenarbeit', label: EXAM_LABEL.klassenarbeit },
            ]}
            onChange={setKind}
          />
          <label className="block text-sm text-slate-500">
            Datum
            <input type="date" className={`${input} mt-1`} min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
      </Section>
      <Section title="Lektionen">
        {props.lessons.length === 0 ? (
          <p className={muted}>Noch keine Lektionen.</p>
        ) : (
          <ul className="space-y-1">
            {props.lessons.map((l) => (
              <li key={l.id}>
                <label className="flex items-center gap-3 py-1">
                  <input type="checkbox" className="size-5 accent-indigo-600" checked={chosen.has(l.id)} onChange={() => setChosen(flip(chosen, l.id))} />
                  <span className="flex-1">{l.title}</span>
                  <span className={muted}>{wordsLabel(props.words.get(l.id)?.length ?? 0)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {chosenWords.length > 0 && (
        <Section title="Wörter">
          <Toggle
            label="Nur bestimmte Wörter"
            hint="Zum Beispiel nur die Wörter von einer Buchseite."
            checked={picked !== null}
            onChange={(on) => setPicked(on ? new Set(chosenWords.map((w) => w.id)) : null)}
          />
          {picked && (
            <ul className="mt-2 max-h-80 space-y-0.5 overflow-y-auto">
              {chosenWords.map((w) => (
                <li key={w.id}>
                  <label className="flex items-center gap-3 py-1">
                    <input type="checkbox" className="size-5 accent-indigo-600" checked={picked.has(w.id)} onChange={() => setPicked(flip(picked, w.id))} />
                    <span className="flex-1 truncate">{w.term}</span>
                    <span className={`${muted} truncate`}>{w.translation}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
      <button
        type="button"
        className={`${primary} w-full`}
        disabled={busy || chosen.size === 0 || !date || date < today || (wordIds !== null && wordIds.length === 0)}
        onClick={save}
      >
        Lernplan erstellen
      </button>
      {failed && <ErrorBox>Speichern hat nicht geklappt. Bitte nochmal versuchen.</ErrorBox>}
      {exam && (
        <button type="button" className={danger} onClick={remove}>
          {label} löschen
        </button>
      )}
    </div>
  )
}

export function ExamPage() {
  const { id = '' } = useParams()
  const { store, settings } = useApp()
  const [data] = useAsync(async () => {
    const exam = await store.getExam(id)
    return exam ? loadExam(store, exam, settings.leitnerIntervals) : null
  }, [store, id, settings.leitnerIntervals])

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  if (!data.data) return <ErrorBox>Diese Prüfung gibt es nicht mehr.</ErrorBox>
  const { exam, lessons, words, plan, states } = data.data
  const { date } = exam
  const label = EXAM_LABEL[exam.kind]

  const cards = words.length * 2
  const ids = new Set(words.map((w) => w.id))
  const safe = [...states.entries()].filter(([key, s]) => s.box >= 3 && ids.has(key.split('|')[0])).length
  const when =
    plan.daysLeft > 1 ? `in ${plan.daysLeft} Tagen` : plan.daysLeft === 1 ? 'morgen' : plan.daysLeft === 0 ? 'heute' : 'vorbei'

  return (
    <div className="space-y-4">
      <Section
        title={label}
        action={
          <Link to={`/pruefung/${exam.id}/bearbeiten`} className={button}>
            Ändern
          </Link>
        }
      >
        <p className="text-lg font-semibold">
          {formatDay(date)} · {when}
        </p>
        <p className={muted}>
          {lessons.map((l) => l.title).join(', ')}
          {exam.word_ids && ` · ${wordsLabel(words.length)} ausgewählt`}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-emerald-600" style={{ width: `${cards ? (safe / cards) * 100 : 0}%` }} />
        </div>
        <p className={`${muted} mt-1`}>
          {safe} von {cards} Karten sicher (ab Fach 3)
        </p>
      </Section>

      {plan.daysLeft >= 0 && (
        <Section title="Heute">
          {plan.todayKeys.size === 0 ? (
            <p>Heute ist nichts dran.</p>
          ) : plan.openToday === 0 ? (
            <p className="text-emerald-600 dark:text-emerald-400">Für heute erledigt. Super!</p>
          ) : (
            <p>
              {plan.daysLeft === 0
                ? `Viel Erfolg! Noch kurz die ${plan.openToday} unsicheren Karten anschauen?`
                : plan.daysLeft === 1
                  ? `Generalprobe: ${plan.openToday} Karten noch einmal.`
                  : `${plan.openToday} Karten sind heute dran.`}
            </p>
          )}
          {plan.todayKeys.size > 0 && (
            <Link to={`/lernen?pruefung=${exam.id}`} className={`${primary} mt-3 block`}>
              {plan.openToday === 0 ? 'Nochmal üben' : 'Jetzt lernen'}
            </Link>
          )}
        </Section>
      )}

      {plan.days.length > 0 && (
        <Section title="Plan">
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {plan.days.map((d) => (
              <li key={d.offset} className="flex justify-between py-2">
                <span className={d.offset === 0 ? 'font-semibold' : ''}>
                  {d.offset === 0 ? 'Heute' : formatDay(isoDay(addDays(new Date(), d.offset)))}
                </span>
                <span className={muted}>
                  {d.finalReview
                    ? exam.kind === 'test'
                      ? 'Generalprobe: unsichere wiederholen'
                      : 'Generalprobe: alles wiederholen'
                    : [d.newCount > 0 && `${d.newCount} neue`, 'fällige wiederholen'].filter(Boolean).join(' + ')}
                </span>
              </li>
            ))}
            <li className="flex justify-between py-2">
              <span className="font-semibold">{formatDay(date)}</span>
              <span className={muted}>{label}</span>
            </li>
          </ul>
        </Section>
      )}
    </div>
  )
}
