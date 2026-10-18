import { Link } from 'react-router-dom'
import type { ProfileStats } from './stats'

// Level, XP, Streak und Tagesziel auf einen Blick.
export function StatsBar({ stats, goal }: { stats: ProfileStats; goal: number }) {
  const { level, streak, todayWords } = stats
  const goalPct = Math.min(100, (todayWords / goal) * 100)
  return (
    <Link
      to="/erfolge"
      className="block rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      aria-label="Erfolge anzeigen"
    >
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-full bg-indigo-600 text-white">
          <span className="text-[10px] leading-none uppercase">Level</span>
          <span className="text-xl leading-none font-bold">{level.level}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{stats.xp} XP</span>
              <span>
                noch {level.needed - level.current} bis Level {level.level + 1}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full bg-indigo-600" style={{ width: `${(level.current / level.needed) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                Tagesziel {Math.min(todayWords, goal)}/{goal} gewusst
                {todayWords >= goal && ' ✓'}
              </span>
              <span>{streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'Tag' : 'Tage'}` : 'Noch keine Serie'}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full bg-emerald-600" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
