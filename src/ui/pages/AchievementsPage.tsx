import { useState } from 'react'
import { addDays } from '../../learn/dates'
import { dayNumber } from '../../learn/leitner'
import { BADGES, badgeCount, badgeProgress, rankOf, STREAK_FREEZES, TIER_NAMES } from '../../learn/motivation'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, PageTitle, Section } from '../components'
import { Icon } from '../icons'
import { Mascot } from '../Mascot'
import { loadStats, type ProfileStats } from '../stats'
import { card, chosen, choice, muted } from '../ui'
import { useAsync } from '../useAsync'

const WEEKS = 12

export function AchievementsPage() {
  const { store, profile, profiles, settings } = useApp()
  const [board, setBoard] = useState<'week' | 'total'>('week')
  const list = profiles.state === 'ready' ? profiles.list : []
  const [data] = useAsync(
    async () => Promise.all(list.map(async (p) => ({ profile: p, stats: await loadStats(store, p.id, settings.dailyGoal) }))),
    [store, profiles, settings.dailyGoal],
  )

  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  const mine = data.data.find((x) => x.profile.id === profile.id)?.stats
  if (!mine) return <Loading />
  const ranked = [...data.data].sort((a, b) => (board === 'week' ? b.stats.weekXp - a.stats.weekXp : b.stats.xp - a.stats.xp))
  const score = (s: ProfileStats) => (board === 'week' ? s.weekXp : s.xp)
  const count = badgeCount(mine)

  return (
    <div className="space-y-4">
      <PageTitle title="Erfolge" />

      <LevelCard stats={mine} />

      <div className="grid grid-cols-2 gap-2.5">
        {[
          ['Serie', `${mine.streak}`, 'flame'],
          ['Beste Serie', `${mine.bestStreak}`, 'star'],
          ['Schutztage frei', `${mine.freezesLeft}/${STREAK_FREEZES}`, 'shield'],
          ['Abfragen', `${mine.reviews}`, 'check'],
        ].map(([label, value, icon], i) => (
          <div key={label} className={`${card} animate-pop flex items-center gap-3 px-3 py-2.5`} style={{ animationDelay: `${60 * i}ms` }}>
            <Icon name={icon as 'flame'} className={`size-6 ${icon === 'shield' ? 'text-sky-500' : 'text-orange-500'}`} />
            <div>
              <b className="block font-display text-2xl leading-none">{value}</b>
              <span className="text-xs font-bold text-slate-500">{label}</span>
            </div>
          </div>
        ))}
      </div>
      <p className={`${muted} -mt-1 px-1 text-xs`}>
        Schutztage retten deine Serie, wenn du mal einen Tag nicht lernst. Du hast {STREAK_FREEZES} pro 30 Tage, sie werden automatisch genutzt.
      </p>

      <Section title="Lern-Kalender">
        <Heatmap perDay={mine.reviewsPerDay} frozen={mine.frozenDays} />
      </Section>

      <Section title={`Abzeichen · ${count.earned} von ${count.total}`}>
        <ul className="grid grid-cols-3 gap-2">
          {BADGES.map((b, i) => (
            <BadgeTile key={b.id} badge={b} stats={mine} delay={i * 40} />
          ))}
        </ul>
      </Section>

      {ranked.length > 1 && (
        <Section
          title="Bestenliste"
          action={
            <div className="flex gap-1 text-sm">
              {(['week', 'total'] as const).map((k) => (
                <button key={k} type="button" onClick={() => setBoard(k)} className={`rounded-xl px-2.5 py-1 font-bold ${board === k ? chosen : choice}`}>
                  {k === 'week' ? 'Woche' : 'Gesamt'}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex items-end justify-center gap-2 pt-2">
            {[1, 0, 2].map((pos) => {
              const e = ranked[pos]
              if (!e) return <div key={pos} className="w-24" />
              const h = ['h-24', 'h-16', 'h-12'][pos]
              return (
                <div key={e.profile.id} className="flex w-24 animate-pop flex-col items-center" style={{ animationDelay: `${pos * 120}ms` }}>
                  <span className="text-3xl" aria-hidden="true">
                    {e.profile.avatar || '🙂'}
                  </span>
                  <span className="max-w-full truncate text-sm font-bold">{e.profile.name}</span>
                  <span className="text-xs text-slate-500">{score(e.stats)} XP</span>
                  <div
                    className={`mt-1 flex w-full items-start justify-center rounded-t-2xl pt-1 font-display text-2xl font-bold text-white ${h} ${
                      ['bg-amber-400', 'bg-slate-400', 'bg-orange-400'][pos]
                    }`}
                  >
                    {pos + 1}
                  </div>
                </div>
              )
            })}
          </div>
          {ranked.length > 3 && (
            <ol start={4} className="mt-3 space-y-1">
              {ranked.slice(3).map(({ profile: p, stats }, i) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                  <span className="w-5 text-center font-bold text-slate-400">{i + 4}</span>
                  <span aria-hidden="true">{p.avatar || '🙂'}</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="font-bold">{score(stats)} XP</span>
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}
    </div>
  )
}

function LevelCard({ stats }: { stats: ProfileStats }) {
  const { level } = stats
  const pct = level.current / level.needed
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <section className="relative flex animate-pop items-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-5 text-white shadow-[0_14px_30px_-12px_rgb(79_70_229/0.7)]">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#FDE68A"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className="transition-[stroke-dashoffset] duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[11px] font-extrabold tracking-widest text-indigo-200 uppercase">Level</span>
          <span className="font-display text-4xl font-bold">{level.level}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-extrabold tracking-wide">{rankOf(level.level)}</p>
        <p className="font-display text-3xl font-bold">{stats.xp} XP</p>
        <p className="text-sm text-indigo-100">
          Noch {level.needed - level.current} XP bis Level {level.level + 1}
        </p>
        <p className="mt-2 text-sm text-indigo-100">Diese Woche: {stats.weekXp} XP</p>
      </div>
      <Mascot mood="cheer" className="absolute -right-3 -bottom-3 w-20 opacity-90" />
    </section>
  )
}

// Farben je Stufe: Bronze, Silber, Gold, Diamant.
const TIER_STYLES = [
  'from-orange-100 to-amber-200 dark:from-orange-950 dark:to-amber-900',
  'from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-600',
  'from-amber-100 to-yellow-300 dark:from-amber-900 dark:to-yellow-700',
  'from-sky-100 to-indigo-200 dark:from-sky-900 dark:to-indigo-800',
]
const TIER_DOTS = ['bg-orange-400', 'bg-zinc-400', 'bg-amber-400', 'bg-sky-400']

function BadgeTile({ badge: b, stats, delay }: { badge: (typeof BADGES)[number]; stats: ProfileStats; delay: number }) {
  const { tier, value, next } = badgeProgress(b, stats)
  const tiered = b.targets.length > 1
  if (b.secret && tier === 0) {
    return (
      <li style={{ animationDelay: `${delay}ms` }} className="flex animate-pop flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-2 text-center dark:border-slate-700">
        <div className="text-3xl text-slate-300 dark:text-slate-600" aria-hidden="true">
          ?
        </div>
        <div className="text-sm leading-tight font-bold text-slate-400">Geheim</div>
      </li>
    )
  }
  const prev = tier > 0 ? b.targets[tier - 1] : 0
  return (
    <li
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-pop rounded-2xl p-2 text-center ${tier > 0 ? `bg-gradient-to-b ${TIER_STYLES[Math.min(tier, 4) - 1]}` : 'bg-slate-100 dark:bg-slate-800'}`}
    >
      <div className={`text-3xl ${tier > 0 ? '' : 'opacity-40 grayscale'}`} aria-hidden="true">
        {b.icon}
      </div>
      <div className="text-sm leading-tight font-bold">{b.title}</div>
      {tiered && (
        <div className="mt-1 flex justify-center gap-1" aria-label={tier > 0 ? `Stufe ${TIER_NAMES[tier - 1]}` : 'Noch keine Stufe'}>
          {b.targets.map((_, n) => (
            <span key={n} className={`size-2 rounded-full ${n < tier ? TIER_DOTS[n] : 'bg-white dark:bg-slate-700'}`} />
          ))}
        </div>
      )}
      {next === undefined ? (
        <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">{b.describe(prev)}</div>
      ) : (
        <>
          <div className="mx-1 mt-1.5 h-1.5 overflow-hidden rounded-full bg-white dark:bg-slate-700">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(Math.min(value, next) / next) * 100}%` }} />
          </div>
          <div className="mt-0.5 text-[11px] leading-tight text-slate-500">
            {tiered ? `${TIER_NAMES[tier]}: ` : ''}
            {b.describe(next)}
          </div>
        </>
      )}
    </li>
  )
}

// Letzte Wochen als Kästchen, je mehr Abfragen, desto kräftiger.
function Heatmap({ perDay, frozen }: { perDay: Map<number, number>; frozen: Set<number> }) {
  const today = new Date()
  const monday = addDays(today, -((today.getDay() + 6) % 7) - (WEEKS - 1) * 7)
  const todayNr = dayNumber(today)
  const shade = (n: number) =>
    n === 0 ? 'bg-slate-100 dark:bg-slate-800' : n < 10 ? 'bg-orange-200' : n < 25 ? 'bg-orange-300' : n < 50 ? 'bg-orange-400' : 'bg-orange-600'
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const d = addDays(monday, i)
          const nr = dayNumber(d)
          const n = perDay.get(nr) ?? 0
          return (
            <span
              key={i}
              title={`${d.toLocaleDateString('de-DE')}: ${frozen.has(nr) ? 'Schutztag' : `${n} Abfragen`}`}
              className={`aspect-square rounded-[4px] ${nr > todayNr ? 'opacity-0' : frozen.has(nr) ? 'bg-sky-300 dark:bg-sky-700' : shade(n)} ${nr === todayNr ? 'ring-2 ring-indigo-400' : ''}`}
            />
          )
        })}
      </div>
      <p className={`${muted} mt-2 flex items-center justify-end gap-1 text-xs`}>
        <span className="size-3 rounded-[3px] bg-sky-300 dark:bg-sky-700" /> Schutztag
        <span className="mx-1" />
        weniger
        {['bg-slate-100 dark:bg-slate-800', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400', 'bg-orange-600'].map((c) => (
          <span key={c} className={`size-3 rounded-[3px] ${c}`} />
        ))}
        mehr
      </p>
    </div>
  )
}
