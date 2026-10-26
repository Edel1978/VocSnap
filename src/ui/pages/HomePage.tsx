import { Link } from 'react-router-dom'
import { languageColor, languageLabel } from '../../config/languages'
import { backupDue } from '../../data/backup'
import type { Direction } from '../../data/types'
import { addDays, isoDay } from '../../learn/dates'
import { cardKey, computeStates, dayNumber, isDue } from '../../learn/leitner'
import { directionsOf } from '../../learn/session'
import { wrongWordIds } from '../../learn/stats'
import { rankOf } from '../../learn/motivation'
import { snappySays } from '../../learn/tips'
import { useState } from 'react'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, StorageError } from '../components'
import { loadExam, upcomingExams, type ExamData } from '../exam'
import { Emoji, type EmojiName } from '../Emoji'
import { Icon } from '../icons'
import { NewSheet } from '../NewSheet'
import { Mascot } from '../Mascot'
import { ProfileForm } from '../ProfileForm'
import { loadStats } from '../stats'
import { card, muted, primary, wordsLabel } from '../ui'
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
  const [sheet, setSheet] = useState(false)
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
      exams: await Promise.all(upcomingExams(await store.listExams(profileId), isoDay()).map((e) => loadExam(store, e, intervals))),
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

  const tip = snappySays({
    words: total,
    due,
    todayWords: stats.todayWords,
    goal,
    streak: stats.streak,
    yesterdayKnown: stats.yesterdayWords,
    hour: today.getHours(),
    savedByFreeze: stats.frozenDays.has(todayNr - 1),
  })
  const test = exams.find((e) => e.exam.kind === 'test')
  const klassenarbeit = exams.find((e) => e.exam.kind === 'klassenarbeit')
  const ring = 2 * Math.PI * 42
  const goalPct = Math.min(1, stats.todayWords / goal)
  const quest = stats.quest
  const questDone = stats.questProgress >= quest.target

  // Füllt die Bildschirmhöhe: die Kacheln wachsen mit, gescrollt wird nur auf sehr kleinen Handys.
  return (
    <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col gap-2.5 pt-3">
      <header className="flex items-center gap-2">
        <Mascot mood={mood} className="w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-semibold">Hallo {name}!</h1>
          <p className="truncate text-xs font-semibold text-slate-500">{tip}</p>
        </div>
        {backupDue(settings.lastBackup, total) && (
          <Link to="/einstellungen/daten" className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Sichern!
          </Link>
        )}
        <Link
          to="/einstellungen/profil"
          aria-label="Profile"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl shadow-[0_0_0_3px_#fff,0_4px_12px_rgb(79_70_229/0.2)] dark:bg-slate-800 dark:shadow-none"
        >
          {avatar || '🙂'}
        </Link>
      </header>

      <section data-tour="hero" className="animate-pop rounded-[26px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-4 text-white shadow-[0_14px_30px_-12px_rgb(79_70_229/0.7)]">
        {total === 0 ? (
          <>
            <p className="text-[11px] font-extrabold tracking-widest text-indigo-200 uppercase">Los geht's</p>
            <p className="mt-1 font-display text-2xl leading-tight font-bold">Leg deine erste Lektion an</p>
            <Link to="/lektion/neu" data-tour="new-lesson" className={`${primary} mt-3 flex items-center justify-center gap-2`}>
              <Icon name="plus" /> Neue Lektion
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <div className="relative size-16 shrink-0" aria-label={`Tagesziel ${stats.todayWords} von ${goal}`}>
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="11" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#FDE68A" strokeWidth="11" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - goalPct)} className="transition-[stroke-dashoffset] duration-700" />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <b className="font-display text-lg">{stats.todayWords}</b>
                  <span className="text-[9px] text-indigo-200">von {goal}</span>
                </span>
              </div>
              <div>
                <p className="text-[11px] font-extrabold tracking-widest text-indigo-200 uppercase">{left > 0 ? 'Heute dran' : 'Tagesziel geschafft!'}</p>
                <p className="font-display text-[28px] leading-none font-bold">{due > 0 ? `${due} ${due === 1 ? 'Wort' : 'Wörter'}` : 'Alles erledigt'}</p>
                <p className="mt-0.5 text-xs text-indigo-100">{due > 0 ? `ca. ${Math.max(1, Math.ceil(due * 0.5))} Minuten` : 'Zeit für neue Wörter?'}</p>
              </div>
            </div>
            <Link to={due > 0 ? '/lernen?start=1' : '/lernen'} className={`${primary} mt-3 flex items-center justify-center gap-2 py-3`}>
              <Icon name="play" /> {due > 0 ? 'Weiterlernen' : 'Frei üben'}
            </Link>
          </>
        )}
      </section>

      <Link to="/erfolge" data-tour="stats" className={`${tile} block p-3`} aria-label="Erfolge anzeigen">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-0.5">
            <Emoji name="fire" />
            <b className="font-display text-2xl leading-none">{stats.streak}</b>
          </span>
          <span className="flex flex-1 justify-between">
            {WEEK.map((d, i) => {
              const nr = dayNumber(addDays(monday, i))
              const done = stats.activeDays.has(nr)
              const frozen = stats.frozenDays.has(nr)
              const isToday = nr === todayNr
              return (
                <span
                  key={d}
                  className={`flex size-7 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    done
                      ? 'bg-orange-500 text-white'
                      : frozen
                        ? 'bg-sky-100 text-sky-600 dark:bg-sky-950'
                        : isToday
                          ? 'border-[3px] border-dashed border-orange-400 text-orange-500'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}
                  title={frozen ? 'Schutztag' : undefined}
                >
                  {frozen ? <Icon name="shield" className="size-3.5" /> : d}
                </span>
              )
            })}
          </span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-display text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Lv {stats.level.level}</span>
        </div>
        {total > 0 && (
          <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-2 dark:from-amber-950 dark:to-orange-950">
            <Emoji name={questDone ? 'party' : 'target'} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <b className="truncate font-display text-[13px]">{questDone ? 'Aufgabe geschafft!' : quest.text}</b>
                <span className="shrink-0 text-[11px] font-bold text-orange-600 dark:text-orange-300">+20 XP</span>
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                  <span className="block h-full rounded-full bg-orange-400 transition-[width] duration-700" style={{ width: `${(stats.questProgress / quest.target) * 100}%` }} />
                </span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {stats.questProgress}/{quest.target}
                </span>
              </span>
            </span>
          </div>
        )}
      </Link>

      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2.5">
        <HomeTile
          to={test ? `/pruefung/${test.exam.id}` : '/pruefung/neu?art=test'}
          emoji="check"
          colors="from-sky-400 to-sky-600"
          title={test ? 'Vokabeltest' : 'Test planen'}
          text={test ? examWhen(test) : 'Lernplan bis zum Test'}
          big={test ? String(test.plan.daysLeft) : undefined}
        />
        <HomeTile
          to={klassenarbeit ? `/pruefung/${klassenarbeit.exam.id}` : '/pruefung/neu?art=klassenarbeit'}
          emoji="calendar"
          colors="from-orange-400 to-orange-600"
          title={klassenarbeit ? 'Klassenarbeit' : 'Arbeit planen'}
          text={klassenarbeit ? examWhen(klassenarbeit) : 'Lernplan bis zur Arbeit'}
          big={klassenarbeit ? String(klassenarbeit.plan.daysLeft) : undefined}
        />
        <HomeTile
          to={errors > 0 ? '/lernen?fehler=1' : '/lernen'}
          emoji={errors > 0 ? 'redo' : 'rocket'}
          colors="from-rose-400 to-pink-600"
          title={errors > 0 ? `${errors} ${errors === 1 ? 'Fehler' : 'Fehler'}` : 'Frei üben'}
          text={errors > 0 ? 'jetzt ausbügeln' : 'alle Lernmodi'}
          big={errors > 0 ? String(errors) : undefined}
        />
        <Link to="/erfolge" className="relative flex animate-pop items-center gap-2.5 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-700 p-3 text-white">
          <Emoji name="star" className="size-10 drop-shadow" />
          <span className="min-w-0 flex-1">
            <b className="block truncate font-display leading-tight">{rankOf(stats.level.level)}</b>
            <span className="text-[11px] font-semibold opacity-90">Level {stats.level.level}</span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/25">
              <span className="block h-full rounded-full bg-amber-200" style={{ width: `${(stats.level.current / stats.level.needed) * 100}%` }} />
            </span>
          </span>
        </Link>
      </div>

      <section data-tour="lessons">
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lektionen</h2>
          <button type="button" onClick={() => setSheet(true)} className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold text-white shadow-press-indigo">
            <Icon name="plus" className="size-4" /> Neu
          </button>
        </div>
        <ul className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
          {lessons.map(({ lesson, count, safe }) => {
            const color = languageColor(lesson.source_lang)
            return (
              <li key={lesson.id} className="w-40 shrink-0 snap-start">
                <Link
                  to={`/lektion/${lesson.id}`}
                  className="block rounded-3xl p-3 text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, #1e1b4b))` }}
                >
                  <span className="text-[10px] font-extrabold uppercase opacity-80">
                    {lesson.source_lang} → {lesson.target_lang}
                  </span>
                  <b className="block truncate font-display leading-tight" title={languageLabel(lesson.source_lang)}>
                    {lesson.title}
                  </b>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/25">
                    <span className="block h-full rounded-full bg-white" style={{ width: `${safe}%` }} />
                  </span>
                  <span className="mt-1 block text-[11px] opacity-90">
                    {wordsLabel(count)} · {safe} %
                  </span>
                </Link>
              </li>
            )
          })}
          <li className="w-24 shrink-0">
            <button type="button" onClick={() => setSheet(true)} className="flex h-full min-h-20 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 text-xs font-bold text-slate-500 dark:border-slate-700">
              <Icon name="plus" />
              Neu
            </button>
          </li>
        </ul>
      </section>
      {sheet && <NewSheet onClose={() => setSheet(false)} />}
    </div>
  )
}

const examWhen = (e: ExamData) => (e.plan.daysLeft === 0 ? 'heute' : e.plan.daysLeft === 1 ? 'morgen' : `in ${e.plan.daysLeft} Tagen`)

function HomeTile(props: { to: string; emoji: EmojiName; colors: string; title: string; text: string; big?: string }) {
  return (
    <Link to={props.to} className={`relative flex animate-pop items-center gap-2.5 overflow-hidden rounded-3xl bg-gradient-to-br ${props.colors} p-3 text-white`}>
      <Emoji name={props.emoji} className="size-10 drop-shadow" />
      <span className="min-w-0">
        <b className="block truncate font-display leading-tight">{props.title}</b>
        <span className="text-[11px] font-semibold opacity-90">{props.text}</span>
      </span>
      {props.big && <span className="pointer-events-none absolute -right-1 -bottom-4 font-display text-6xl font-bold opacity-20">{props.big}</span>}
    </Link>
  )
}
