import { Link } from 'react-router-dom'
import { languageLabel } from '../../config/languages'
import type { Direction } from '../../data/types'
import { cardKey, computeStates, isDue } from '../../learn/leitner'
import { formatDay, isoDay } from '../../learn/dates'
import { learnedToday, wrongWordIds } from '../../learn/stats'
import { examDates, loadExam } from '../exam'

const DIRS: Direction[] = ['to_target', 'to_source']
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section, StorageError } from '../components'
import { ProfileForm } from '../ProfileForm'
import { primary, button, muted } from '../ui'
import { useAsync } from '../useAsync'

export function HomePage() {
  const { profiles, profile, store, updateSettings, reloadProfiles } = useApp()

  if (profiles.state === 'loading') return <Loading />
  if (profiles.state === 'error') return <StorageError />

  if (!profile) {
    return (
      <Section title="Willkommen">
        <p className="mb-3">Leg zuerst ein Profil an. Jedes Profil hat seinen eigenen Lernstand.</p>
        <ProfileForm
          label="Anlegen"
          onSubmit={async (name) => {
            const p = await store.createProfile({ name })
            updateSettings({ activeProfileId: p.id })
            await reloadProfiles()
          }}
        />
      </Section>
    )
  }

  return <ProfileHome profileId={profile.id} />
}

function ProfileHome({ profileId }: { profileId: string }) {
  const { store, settings } = useApp()
  const intervals = settings.leitnerIntervals
  const [data] = useAsync(async () => {
    const lessons = await store.listLessons(profileId)
    lessons.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const words = await Promise.all(lessons.map((l) => store.listWords(l.id)))
    const events = await store.listReviewEvents(profileId)
    const wrong = wrongWordIds(events)
    const errors = words.flat().filter((w) => wrong.has(w.id)).length
    const states = computeStates(events)
    // Wörter mit mindestens einer fälligen Richtung.
    const due = words
      .flat()
      .filter((w) => DIRS.some((d) => isDue(states.get(cardKey(w.id, d)), intervals))).length
    const exams = await Promise.all(
      examDates(lessons, isoDay()).map((d) => loadExam(store, profileId, d, intervals)),
    )
    return {
      exams,
      lessons: lessons.map((l, i) => ({ lesson: l, count: words[i].length })),
      total: words.flat().length,
      errors,
      due,
      learnedToday: learnedToday(events),
    }
  }, [store, profileId, intervals])

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  const { lessons, total, errors, due, exams } = data.data

  return (
    <div className="space-y-4">
      {total > 0 && !data.data.learnedToday && (
        <p className="rounded-2xl bg-amber-100 p-4 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Du hast heute noch nicht gelernt. Ein paar Minuten reichen schon!
        </p>
      )}

      {total > 0 && (
        <div className="grid gap-3">
          <Link to="/lernen" className={primary}>
            {due > 0 ? `Lernen (${due} fällig)` : 'Lernen'}
          </Link>
          {errors > 0 && (
            <Link to="/lernen?fehler=1" className={`${button} py-3 text-center`}>
              Fehler wiederholen ({errors})
            </Link>
          )}
        </div>
      )}

      {exams.map((e) => (
        <Link
          key={e.date}
          to={`/arbeit/${e.date}`}
          className="block rounded-2xl border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950"
        >
          <span className="block font-semibold">
            Klassenarbeit {formatDay(e.date)}
            {e.plan.daysLeft === 0 ? ' · heute' : e.plan.daysLeft === 1 ? ' · morgen' : ` · in ${e.plan.daysLeft} Tagen`}
          </span>
          <span className={muted}>
            {e.plan.openToday > 0 ? `Heute noch ${e.plan.openToday} Karten` : 'Für heute erledigt'} ·{' '}
            {e.lessons.map((l) => l.title).join(', ')}
          </span>
        </Link>
      ))}

      <Section
        title="Lektionen"
        action={
          <Link to="/lektion/neu" className={button}>
            + Neu
          </Link>
        }
      >
        {lessons.length === 0 ? (
          <p className={muted}>Noch keine Lektionen. Leg eine an und trag Vokabeln ein.</p>
        ) : (
          <ul className="-mx-2">
            {lessons.map(({ lesson, count }) => (
              <li key={lesson.id}>
                <Link
                  to={`/lektion/${lesson.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>
                    <span className="block font-medium">{lesson.title}</span>
                    <span className={muted}>
                      {languageLabel(lesson.source_lang)} → {languageLabel(lesson.target_lang)}
                    </span>
                  </span>
                  <span className={muted}>{count} Wörter</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {lessons.length > 0 && (
        <Link to="/arbeit" className={`${button} block py-3 text-center`}>
          Klassenarbeit planen
        </Link>
      )}

      <p className={`${muted} px-1`}>
        Daten liegen nur auf diesem Gerät. Regelmäßig in den Einstellungen exportieren.
      </p>
    </div>
  )
}
