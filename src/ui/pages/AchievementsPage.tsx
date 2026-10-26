import { useState } from 'react'
import { addDays } from '../../learn/dates'
import { dayNumber } from '../../learn/leitner'
import { BADGES, badgeCount, badgeProgress, rankOf, STREAK_FREEZES, TIER_NAMES } from '../../learn/motivation'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, PageTitle, Section } from '../components'
import { Emoji, type EmojiName } from '../Emoji'
import { Mascot } from '../Mascot'
import { loadStats, type ProfileStats } from '../stats'
import { card, chosen, choice, muted } from '../ui'
import { useAsync } from '../useAsync'

const WEEKS = 12

export function AchievementsPage() {
  const { store, profile, profiles, settings } = useApp()
  const [board, setBoard] = useState<'week' | 'total'>('week')
  const [view, setView] = useState<'badges' | 'stats' | 'board'>('badges')
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

  return (
    <div className="space-y-4">
      <PageTitle title="Erfolge" />

      <LevelCard stats={mine} />

      {/* Reiter statt langer Seite: Abzeichen, Statistik, Bestenliste. */}
      <div className={`grid ${ranked.length > 1 ? 'grid-cols-3' : 'grid-cols-2'} gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800`} role="tablist">
        {(
          [
            ['badges', 'Abzeichen'],
            ['stats', 'Statistik'],
            ...(ranked.length > 1 ? ([['board', 'Bestenliste']] as const) : []),
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={`rounded-xl py-2 text-sm font-bold transition ${view === k ? 'bg-white text-indigo-700 shadow-card dark:bg-slate-900 dark:text-indigo-300' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'stats' && (
        <>
          <div className={`${card} grid animate-pop grid-cols-4 gap-1 text-center`}>
            {(
              [
                ['fire', `${mine.streak}`, 'Serie'],
                ['star', `${mine.bestStreak}`, 'Beste'],
                ['shield', `${mine.freezesLeft}/${STREAK_FREEZES}`, 'Schutztage'],
                ['check', `${mine.reviews}`, 'Abfragen'],
              ] as const
            ).map(([emoji, value, label]) => (
              <div key={label}>
                <Emoji name={emoji} className="mx-auto size-8" />
                <b className="mt-1 block font-display text-xl leading-none">{value}</b>
                <span className="text-[11px] font-bold text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          <p className={`${muted} -mt-1 px-1 text-xs`}>Schutztage retten deine Serie, wenn du mal einen Tag nicht lernst ({STREAK_FREEZES} pro 30 Tage, automatisch).</p>
          <Section title="Lern-Kalender">
            <Heatmap perDay={mine.reviewsPerDay} frozen={mine.frozenDays} />
          </Section>
        </>
      )}

      {view === 'badges' && <Badges stats={mine} />}

      {view === 'board' && ranked.length > 1 && (
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

// Stufenfarben: Bronze, Silber, Gold, Diamant (Rahmen, Schild, Schrift).
const TIER_RING = ['border-orange-500', 'border-zinc-400', 'border-amber-400', 'border-sky-400']
const TIER_BG = ['bg-orange-600', 'bg-zinc-400', 'bg-amber-500', 'bg-sky-500']
const TIER_TEXT = ['text-orange-600', 'text-zinc-500', 'text-amber-600', 'text-sky-600']
// Farbe des Balkens = Farbe der nächsten Stufe.
const TIER_BAR = ['bg-orange-400', 'bg-zinc-400', 'bg-amber-400', 'bg-sky-400']
const BADGE_EMOJI: Record<string, EmojiName> = {
  reviews: 'hundred', streak: 'fire', goal: 'target', level: 'star', box5: 'brain', words: 'camera',
  perfect: 'sparkles', modes: 'game', early: 'sunrise', night: 'owl', comeback: 'muscle', exam: 'memo',
}
const HINTS: Record<string, string> = {
  early: 'Lern mal ganz früh am Morgen …',
  night: 'Wer lernt noch spät am Abend?',
  comeback: 'Manchmal braucht man eine Pause …',
  exam: 'Gut vorbereitet in die Prüfung …',
}

type Filter = 'all' | 'close' | 'earned'

function Badges({ stats }: { stats: ProfileStats }) {
  const [filter, setFilter] = useState<Filter>('all')
  const list = BADGES.map((b) => ({ b, p: badgeProgress(b, stats) }))
  const ratio = (x: (typeof list)[number]) => (x.p.next ? Math.min(x.p.value, x.p.next) / x.p.next : 0)
  const count = badgeCount(stats)
  const medals = [0, 1, 2, 3].map((t) => list.filter((x) => Math.min(x.p.tier, 4) - 1 === t).length)
  const close = list.filter((x) => !x.b.secret && x.p.next !== undefined).sort((a, b) => ratio(b) - ratio(a))[0]
  const shown = list.filter((x) => (filter === 'earned' ? x.p.tier > 0 : filter === 'close' ? !x.b.secret && x.p.next !== undefined && ratio(x) >= 0.5 : true))
  return (
    <section className="space-y-3">
      <p className={`${muted} -mb-1 px-1`}>
        {count.earned} von {count.total} Stufen erreicht
      </p>
      <div className="flex justify-around rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-3 text-white">
        {TIER_NAMES.map((name, t) => (
          <div key={name} className="text-center">
            <b className="block font-display text-xl">{medals[t]}</b>
            <span className="text-[10px] font-bold opacity-90">{['🥉', '🥈', '🥇', '💎'][t]} {name}</span>
          </div>
        ))}
      </div>
      {close && ratio(close) > 0 && (
        <div className="flex items-center gap-3 rounded-3xl bg-amber-50 p-3 ring-2 ring-amber-200 dark:bg-amber-950 dark:ring-amber-800">
          <Emoji name={BADGE_EMOJI[close.b.id]} className="size-10" />
          <span className="min-w-0 flex-1">
            <b className="block font-display text-sm">
              Fast geschafft: {close.b.title} {close.b.targets.length > 1 ? TIER_NAMES[close.p.tier] : ''}
            </b>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {close.p.value} von {close.p.next}, du schaffst das!
            </span>
          </span>
        </div>
      )}
      <div className="flex gap-1.5 text-xs font-bold">
        {(
          [
            ['all', 'Alle'],
            ['close', 'Fast geschafft'],
            ['earned', 'Erreicht'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? 'bg-indigo-600 text-white' : 'bg-white shadow-card dark:bg-slate-800'}`}>
            {label}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2.5">
        {shown.map(({ b, p }, i) => (
          <BadgeTile key={b.id} badge={b} progress={p} delay={i * 30} />
        ))}
      </ul>
      {shown.length === 0 && <p className={`${muted} text-center`}>Hier ist noch nichts. Weiter so!</p>}
    </section>
  )
}

function BadgeTile({ badge: b, progress, delay }: { badge: (typeof BADGES)[number]; progress: ReturnType<typeof badgeProgress>; delay: number }) {
  const { tier, value, next } = progress
  const tiered = b.targets.length > 1
  if (b.secret && tier === 0) {
    return (
      <li style={{ animationDelay: `${delay}ms` }} className="animate-pop rounded-3xl border-2 border-dashed border-slate-200 p-2.5 pt-3 text-center dark:border-slate-700">
        <span className="mx-auto flex h-14 w-[86px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Emoji name="lock" className="size-9 opacity-70" />
        </span>
        <b className="mt-1.5 block text-sm text-slate-500">Geheim</b>
        <span className="text-[10px] leading-tight text-slate-400">{HINTS[b.id]}</span>
      </li>
    )
  }
  const t = Math.min(tier, 4) - 1
  const tierName = tier > 0 ? (tiered ? TIER_NAMES[t] : 'Erreicht') : 'noch keine'
  return (
    <li
      style={{ animationDelay: `${delay}ms` }}
      className={`relative animate-pop rounded-3xl bg-white p-2.5 pt-3 text-center shadow-card dark:bg-slate-900 dark:shadow-card-dark ${t >= 2 ? 'shadow-[0_0_18px_rgb(251_191_36/0.5)]' : ''}`}
    >
      {tier > 0 && tiered && (
        <span className={`absolute top-1.5 right-1.5 rounded-full px-1.5 text-[9px] font-extrabold text-white ${TIER_BG[t]}`}>{TIER_NAMES[t][0]}</span>
      )}
      <span
        className={`mx-auto flex h-14 w-[86px] items-center justify-center rounded-full border-[3.5px] bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 ${
          tier > 0 ? TIER_RING[t] : 'border-dashed border-slate-200 dark:border-slate-700'
        }`}
      >
        <Emoji name={BADGE_EMOJI[b.id]} className={`size-10 ${tier > 0 ? '' : 'opacity-50 grayscale'}`} />
      </span>
      <b className="mt-1.5 block text-sm leading-tight">{b.title}</b>
      <span className={`text-[11px] font-extrabold ${tier > 0 ? TIER_TEXT[t] : 'text-slate-400'}`}>{tierName}</span>
      {next === undefined ? (
        <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">{b.describe(b.targets[b.targets.length - 1])}</span>
      ) : (
        <>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <span className={`block h-full rounded-full ${TIER_BAR[Math.min(tier, 3)]}`} style={{ width: `${(Math.min(value, next) / next) * 100}%` }} />
          </span>
          <span className="text-[10px] leading-tight text-slate-500">
            {value} / {next}
            {tiered ? ` für ${TIER_NAMES[tier]}` : ''}
          </span>
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
