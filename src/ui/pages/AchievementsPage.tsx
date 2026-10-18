import { useState } from 'react'
import { BADGES } from '../../learn/motivation'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { loadStats } from '../stats'
import { StatsBar } from '../StatsBar'
import { muted } from '../ui'
import { useAsync } from '../useAsync'

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
  const ranked = [...data.data].sort((a, b) =>
    board === 'week' ? b.stats.weekXp - a.stats.weekXp : b.stats.xp - a.stats.xp,
  )

  return (
    <div className="space-y-4">
      <StatsBar stats={mine} goal={settings.dailyGoal} />

      <Section title="Rekorde">
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Abfragen', mine.reviews],
            ['Längste Serie', `${mine.bestStreak} T.`],
            ['Ziel erreicht', `${mine.goalDays}×`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Abzeichen">
        <ul className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const earned = b.earned(mine)
            return (
              <li
                key={b.id}
                className={`rounded-xl p-2 text-center ${earned ? 'bg-amber-100 dark:bg-amber-950' : 'bg-slate-100 opacity-50 grayscale dark:bg-slate-800'}`}
              >
                <div className="text-3xl" aria-hidden="true">
                  {b.icon}
                </div>
                <div className="text-sm font-semibold">{b.title}</div>
                <div className="text-xs text-slate-500">{b.description}</div>
              </li>
            )
          })}
        </ul>
      </Section>

      {ranked.length > 1 && (
        <Section
          title="Bestenliste"
          action={
            <div className="flex gap-1 text-sm">
              {(['week', 'total'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setBoard(k)}
                  className={`rounded-lg px-2 py-1 ${board === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {k === 'week' ? 'Woche' : 'Gesamt'}
                </button>
              ))}
            </div>
          }
        >
          <ol className="space-y-1">
            {ranked.map(({ profile: p, stats }, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 ${p.id === profile.id ? 'bg-indigo-50 dark:bg-indigo-950' : ''}`}
              >
                <span className="w-6 text-center font-semibold">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                <span className="text-xl" aria-hidden="true">
                  {p.avatar || '🙂'}
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className={muted}>Lv {stats.level.level}</span>
                <span className="w-16 text-right font-semibold">{board === 'week' ? stats.weekXp : stats.xp} XP</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  )
}
