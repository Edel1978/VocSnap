import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addDays, formatDay, isoDay } from '../../learn/dates'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { loadExam } from '../exam'
import { button, danger, input, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

// Neue Arbeit planen oder bestehende ändern (?datum=…).
export function ExamEditPage() {
  const { store, profile } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const oldDate = params.get('datum')
  const [lessons] = useAsync(async () => {
    const list = profile ? await store.listLessons(profile.id) : []
    return list.sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, [store, profile])
  const [date, setDate] = useState(oldDate ?? isoDay(addDays(new Date(), 7)))
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  if (lessons.state === 'loading') return <Loading />
  if (lessons.state === 'error') return <ErrorBox />
  const chosen = selected ?? new Set(lessons.data.filter((l) => oldDate && l.exam_date === oldDate).map((l) => l.id))
  const today = isoDay()

  const toggle = (id: string) => {
    const next = new Set(chosen)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const save = async () => {
    setBusy(true)
    setFailed(false)
    try {
      for (const l of lessons.data) {
        if (chosen.has(l.id)) {
          if (l.exam_date !== date) await store.updateLesson(l.id, { exam_date: date })
        } else if (oldDate && l.exam_date === oldDate) {
          await store.updateLesson(l.id, { exam_date: null })
        }
      }
      navigate(`/arbeit/${date}`, { replace: true })
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!oldDate || !confirm('Plan für diese Klassenarbeit löschen? Die Lektionen bleiben erhalten.')) return
    try {
      for (const l of lessons.data) if (l.exam_date === oldDate) await store.updateLesson(l.id, { exam_date: null })
      navigate('/', { replace: true })
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="space-y-4">
      <Section title={oldDate ? 'Klassenarbeit ändern' : 'Klassenarbeit planen'}>
        <label className="block text-sm text-slate-500">
          Datum der Arbeit
          <input type="date" className={`${input} mt-1`} min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </Section>
      <Section title="Lektionen">
        {lessons.data.length === 0 ? (
          <p className={muted}>Noch keine Lektionen.</p>
        ) : (
          <ul className="space-y-1">
            {lessons.data.map((l) => (
              <li key={l.id}>
                <label className="flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    className="size-5 accent-indigo-600"
                    checked={chosen.has(l.id)}
                    onChange={() => toggle(l.id)}
                  />
                  <span className="flex-1">{l.title}</span>
                  {l.exam_date && l.exam_date !== oldDate && l.exam_date >= today && (
                    <span className={muted}>Arbeit {formatDay(l.exam_date)}</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <button
        type="button"
        className={`${primary} w-full`}
        disabled={busy || chosen.size === 0 || !date || date < today}
        onClick={save}
      >
        Lernplan erstellen
      </button>
      {failed && <ErrorBox>Speichern hat nicht geklappt. Bitte nochmal versuchen.</ErrorBox>}
      {oldDate && (
        <button type="button" className={danger} onClick={remove}>
          Plan löschen
        </button>
      )}
    </div>
  )
}

export function ExamPage() {
  const { date = '' } = useParams()
  const { store, profile, settings } = useApp()
  const [data] = useAsync(
    async () => (profile ? loadExam(store, profile.id, date, settings.leitnerIntervals) : null),
    [store, profile, date, settings.leitnerIntervals],
  )

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error' || !data.data) return <ErrorBox />
  const { lessons, words, plan, states } = data.data
  if (lessons.length === 0) return <ErrorBox>Für dieses Datum ist keine Klassenarbeit geplant.</ErrorBox>

  const cards = words.length * 2
  const safe = [...states.entries()].filter(
    ([key, s]) => s.box >= 3 && words.some((w) => key.startsWith(`${w.id}|`)),
  ).length
  const when =
    plan.daysLeft > 1 ? `in ${plan.daysLeft} Tagen` : plan.daysLeft === 1 ? 'morgen' : plan.daysLeft === 0 ? 'heute' : 'vorbei'

  return (
    <div className="space-y-4">
      <Section
        title="Klassenarbeit"
        action={
          <Link to={`/arbeit?datum=${date}`} className={button}>
            Ändern
          </Link>
        }
      >
        <p className="text-lg font-semibold">
          {formatDay(date)} · {when}
        </p>
        <p className={muted}>{lessons.map((l) => l.title).join(', ')}</p>
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
            <Link to={`/lernen?arbeit=${date}`} className={`${primary} mt-3 block`}>
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
                    ? 'Generalprobe: alles wiederholen'
                    : [d.newCount > 0 && `${d.newCount} neue`, 'fällige wiederholen'].filter(Boolean).join(' + ')}
                </span>
              </li>
            ))}
            <li className="flex justify-between py-2">
              <span className="font-semibold">{formatDay(date)}</span>
              <span className={muted}>Klassenarbeit</span>
            </li>
          </ul>
        </Section>
      )}
    </div>
  )
}
