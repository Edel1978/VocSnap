import { Link } from 'react-router-dom'
import { languageColor, languageLabel } from '../../config/languages'
import { backupDue, daysSince } from '../../data/backup'
import type { Direction } from '../../data/types'
import { addDays, formatDay, isoDay } from '../../learn/dates'
import { cardKey, computeStates, dayNumber, isDue } from '../../learn/leitner'
import { directionsOf } from '../../learn/session'
import { wrongWordIds } from '../../learn/stats'
import { snappySays } from '../../learn/tips'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, StorageError } from '../components'
import { examDates, loadExam } from '../exam'
import { Icon } from '../icons'
import { Mascot } from '../Mascot'
import { ProfileForm } from '../ProfileForm'
import { loadStats } from '../stats'
import { button, card, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

const DIRS: Direction[] = ['to_target', 'to_source']
const WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const tile = `${card} animate-pop`

export function HomePage() {
  const { profiles, profile, store, updateSettings, reloadProfiles } = useApp()

  if (profiles.state === 'loading') return <Loading />
  if (profiles.state === 'error') return <StorageError />

  if (!profile) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex flex-col items-center text-center">
          <Mascot mood="cheer" className="w-36" />
          <h1 className="mt-2 text-3xl font-bold">Willkommen bei VocSnap</h1>
          <p className={`${muted} mt-1 max-w-xs`}>Vokabeln fotografieren, kurz prüfen und spielerisch lernen.</p>
        </div>
        <section className={tile}>
          <h2 className="mb-3 text-lg font-semibold">Wie heißt du?</h2>
          <ProfileForm
            label="Los geht's"
            onSubmit={async (name, avatar) => {
              const p = await store.createProfile({ name, avatar })
              updateSettings({ activeProfileId: p.id })
              await reloadProfiles()
            }}
          />
          <p className={`${muted} mt-3`}>Jedes Profil hat seinen eigenen Lernstand. Weitere Profile kannst du später anlegen.</p>
        </section>
      </div>
    )
  }

  return <ProfileHome profileId={profile.id} name={profile.name} avatar={profile.avatar} />
}

function ProfileHome({ profileId, name, avatar }: { profileId: string; name: string; avatar: string }) {
  const { store, settings } = useApp()
  const intervals = settings.leitnerIntervals
  const [data] = useAsync(async () => {
    const lessons = await store.listLessons(profileId)
    lessons.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const words = await Promise.all(lessons.map((l) => store.listWords(l.id)))
    const events = await store.listReviewEvents(profileId)
    const wrong = wrongWordIds(events)
    const states = computeStates(events)
    const all = words.flat()
    return {
      exams: await Promise.all(examDates(lessons, isoDay()).map((d) => loadExam(store, profileId, d, intervals))),
      stats: await loadStats(store, profileId, settings.dailyGoal),
      lessons: lessons.map((l, i) => {
        const cards = words[i].length * DIRS.length
        const safe = words[i].reduce(
          (n, w) => n + DIRS.filter((d) => (states.get(cardKey(w.id, d))?.box ?? 0) >= 3).length,
          0,
        )
        return { lesson: l, count: words[i].length, safe: cards ? Math.round((safe / cards) * 100) : 0 }
      }),
      total: all.length,
      errors: all.filter((w) => wrong.has(w.id)).length,
      // Fällige Wörter in der Richtung, die „Weiterlernen" abfragt.
      due: all.filter((w) => directionsOf(settings.learnDirection).some((d) => isDue(states.get(cardKey(w.id, d)), intervals)))
        .length,
    }
  }, [store, profileId, intervals, settings.dailyGoal, settings.learnDirection])

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  const { lessons, total, errors, due, exams, stats } = data.data
  const goal = settings.dailyGoal
  const left = Math.max(0, goal - stats.todayWords)
  const today = new Date()
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  const todayNr = dayNumber(today)
  // Snappy freut sich, wenn alles erledigt ist, und wird müde, wenn länger nicht gelernt wurde.
  const mood = total > 0 && due === 0 ? 'cheer' : stats.reviews > 0 && stats.streak === 0 ? 'sleepy' : 'happy'

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {today.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-semibold">Hallo {name}!</h1>
        </div>
        <Link
          to="/einstellungen/profil"
          aria-label="Profile"
          className="flex size-12 items-center justify-center rounded-full bg-orange-100 text-2xl shadow-[0_0_0_3px_#fff,0_4px_12px_rgb(79_70_229/0.2)] dark:bg-slate-800 dark:shadow-none"
        >
          {avatar || '🙂'}
        </Link>
      </header>

      <p className="relative ml-auto w-fit max-w-[78%] animate-pop rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-sm font-semibold shadow-card dark:bg-slate-900 dark:shadow-card-dark">
        {snappySays({
          words: total,
          due,
          todayWords: stats.todayWords,
          goal,
          streak: stats.streak,
          yesterdayKnown: stats.yesterdayWords,
          hour: today.getHours(),
          savedByFreeze: stats.frozenDays.has(todayNr - 1),
        })}
      </p>

      <section data-tour="hero" className="relative animate-pop rounded-[28px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-5 text-white shadow-[0_14px_30px_-12px_rgb(79_70_229/0.7)]">
        <Mascot mood={mood} className="absolute -top-7 right-1 w-28 drop-shadow-lg" />
        {total === 0 ? (
          <>
            <p className="text-xs font-extrabold tracking-widest text-indigo-200 uppercase">Los geht's</p>
            <p className="mt-1 max-w-[65%] font-display text-2xl leading-tight font-bold">Leg deine erste Lektion an</p>
            <Link to="/lektion/neu" data-tour="new-lesson" className={`${primary} mt-4 flex items-center justify-center gap-2`}>
              <Icon name="plus" /> Neue Lektion
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs font-extrabold tracking-widest text-indigo-200 uppercase">Heute dran</p>
            <p className="pr-24 font-display text-[40px] leading-[1.05] font-bold">
              {due > 0 ? `${due} ${due === 1 ? 'Wort' : 'Wörter'}` : 'Alles erledigt'}
            </p>
            <p className="mt-1.5 text-sm text-indigo-100">
              {left > 0 ? `Noch ${left} bis zum Tagesziel` : 'Tagesziel geschafft!'}
              {due > 0 && ` · ca. ${Math.max(1, Math.ceil(due * 0.5))} Min.`}
            </p>
            <div className="mt-3.5 h-2.5 max-w-[62%] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-amber-200 transition-[width] duration-700"
                style={{ width: `${Math.min(100, (stats.todayWords / goal) * 100)}%` }}
              />
            </div>
            <Link to={due > 0 ? '/lernen?start=1' : '/lernen'} className={`${primary} mt-4 flex items-center justify-center gap-2`}>
              <Icon name="play" /> {due > 0 ? 'Weiterlernen' : 'Frei üben'}
            </Link>
          </>
        )}
      </section>

      <Link to="/erfolge" data-tour="stats" className="grid grid-cols-3 gap-2.5" aria-label="Erfolge anzeigen">
        <div className={`${tile} relative px-3 py-2.5`} style={{ animationDelay: '60ms' }}>
          <Icon name="flame" className="absolute top-2.5 right-2.5 size-5 text-orange-500" />
          <b className="font-display text-2xl leading-none">{stats.streak}</b>
          <span className="block text-xs font-bold text-slate-500">{stats.streak === 1 ? 'Tag Serie' : 'Tage Serie'}</span>
        </div>
        <div className={`${tile} px-3 py-2.5`} style={{ animationDelay: '120ms' }}>
          <b className="font-display text-2xl leading-none">{stats.level.level}</b>
          <span className="block text-xs font-bold text-slate-500">Level</span>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-indigo-500" style={{ width: `${(stats.level.current / stats.level.needed) * 100}%` }} />
          </div>
        </div>
        <div className={`${tile} px-3 py-2.5`} style={{ animationDelay: '180ms' }}>
          <b className="font-display text-2xl leading-none">{stats.xp}</b>
          <span className="block text-xs font-bold text-slate-500">XP</span>
        </div>
      </Link>

      <div className={`${tile} flex justify-between px-3 py-2.5`} style={{ animationDelay: '220ms' }} aria-label="Diese Woche">
        {WEEK.map((d, i) => {
          const nr = dayNumber(addDays(monday, i))
          const done = stats.activeDays.has(nr)
          const frozen = stats.frozenDays.has(nr)
          const isToday = nr === todayNr
          return (
            <div key={d} className="flex flex-col items-center gap-1 text-[11px] font-bold">
              <span className={isToday ? 'text-orange-500' : done ? '' : 'text-slate-400'}>{d}</span>
              <span
                className={`flex size-7 items-center justify-center rounded-full ${
                  done
                    ? 'bg-orange-500 text-white'
                    : frozen
                      ? 'bg-sky-100 text-sky-500 dark:bg-sky-950'
                      : isToday
                      ? 'border-[3px] border-dashed border-orange-400'
                      : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {done && <Icon name="check" className="size-4" />}
                {frozen && <Icon name="shield" className="size-4" />}
              </span>
            </div>
          )
        })}
      </div>

      {exams.map((e) => (
        <Link key={e.date} to={`/arbeit/${e.date}`} className={`${tile} flex items-center gap-3`}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950">
            <Icon name="calendar" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display font-semibold">Klassenarbeit {formatDay(e.date)}</b>
            <span className={`${muted} block truncate`}>
              {e.plan.daysLeft === 0 ? 'heute' : e.plan.daysLeft === 1 ? 'morgen' : `in ${e.plan.daysLeft} Tagen`} ·{' '}
              {e.plan.openToday > 0 ? `heute ${e.plan.openToday} Karten` : 'für heute erledigt'}
            </span>
          </span>
          <Icon name="chevron" className="size-5 text-slate-400" />
        </Link>
      ))}

      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/scan" className={`${button} flex items-center gap-2 px-4 py-3.5 text-[15px]`}>
          <Icon name="camera" /> Foto scannen
        </Link>
        <Link to="/lektion/neu" className={`${button} flex items-center gap-2 px-4 py-3.5 text-[15px]`}>
          <Icon name="plus" /> Neue Lektion
        </Link>
      </div>

      {backupDue(settings.lastBackup, total) && (
        <Link to="/einstellungen/daten" className={`${tile} flex items-center gap-3 border-2 border-amber-300 dark:border-amber-700`}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950">
            <Icon name="database" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display font-semibold">Zeit für eine Sicherung</b>
            <span className={`${muted} block text-sm`}>
              {settings.lastBackup ? `Letzte vor ${daysSince(settings.lastBackup)} Tagen.` : 'Deine Wörter sind noch nicht gesichert.'} Tippe hier.
            </span>
          </span>
          <Icon name="chevron" className="size-5 text-slate-400" />
        </Link>
      )}

      {errors > 0 && (
        <Link to="/lernen?fehler=1" className={`${button} block py-3 text-center`}>
          Fehler wiederholen ({errors})
        </Link>
      )}

      {lessons.length > 0 && (
        <section data-tour="lessons">
          <h2 className="mb-2.5 text-xl font-semibold">Deine Lektionen</h2>
          <ul className="space-y-2.5">
            {lessons.map(({ lesson, count, safe }, i) => {
              const color = languageColor(lesson.source_lang)
              return (
                <li key={lesson.id} className="animate-pop" style={{ animationDelay: `${260 + i * 50}ms` }}>
                  <Link
                    to={`/lektion/${lesson.id}`}
                    className={`${card} flex items-center gap-3 border-l-[6px] py-3`}
                    style={{ borderLeftColor: color }}
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold uppercase"
                      style={{ color, backgroundColor: `${color}22` }}
                      title={languageLabel(lesson.source_lang)}
                    >
                      {lesson.source_lang}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-medium">{lesson.title}</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${safe}%` }} />
                      </span>
                      <span className={`${muted} mt-1 block text-xs`}>
                        {count} Wörter · {safe} % sicher
                      </span>
                    </span>
                    <Icon name="chevron" className="size-5 text-slate-400" />
                  </Link>
                </li>
              )
            })}
          </ul>
          {lessons.length > 0 && (
            <Link to="/arbeit" className={`${button} mt-3 block py-3 text-center`}>
              Klassenarbeit planen
            </Link>
          )}
        </section>
      )}

      <p className={`${muted} px-1 text-xs`}>
        Daten liegen nur auf diesem Gerät. Regelmäßig in den Einstellungen sichern.
      </p>
    </div>
  )
}
