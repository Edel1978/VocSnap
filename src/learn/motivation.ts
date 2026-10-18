import type { ReviewEvent, ReviewResult } from '../data/types'
import { dayNumber } from './leitner'

export const XP: Record<ReviewResult, number> = { correct: 10, half: 5, wrong: 1 }

// XP für Level n: 50 · (n-1)². Level 2 ab 50, Level 3 ab 200, Level 4 ab 450 …
export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2
}

export interface LevelInfo {
  level: number
  // Fortschritt innerhalb des Levels.
  current: number
  needed: number
}

export function levelInfo(xp: number): LevelInfo {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1
  const base = xpForLevel(level)
  return { level, current: xp - base, needed: xpForLevel(level + 1) - base }
}

export interface Stats {
  xp: number
  weekXp: number
  level: LevelInfo
  // Tage in Folge mit mindestens einer Abfrage, bis heute oder gestern.
  streak: number
  bestStreak: number
  // Verschiedene Wörter, die heute gewusst wurden (richtig oder halb). Grundlage für das Tagesziel.
  todayWords: number
  yesterdayWords: number
  reviews: number
  // Tage, an denen das Tagesziel erreicht wurde.
  goalDays: number
  // Tage mit mindestens einer Abfrage (dayNumber), z. B. für die Wochenleiste.
  activeDays: Set<number>
  // Abfragen je Tag (dayNumber), für den Lern-Kalender.
  reviewsPerDay: Map<number, number>
}

// Berechnet alle Kennzahlen aus den Ereignissen.
export function computeStats(events: ReviewEvent[], dailyGoal: number, now: Date = new Date()): Stats {
  const active = events.filter((e) => e.deleted_at === null)
  const today = dayNumber(now)
  // Nur gewusste Wörter zählen fürs Tagesziel, aktive Tage (Streak) zählen jede Abfrage.
  const knownPerDay = new Map<number, Set<string>>()
  const activeDays = new Set<number>()
  const reviewsPerDay = new Map<number, number>()
  let xp = 0
  let weekXp = 0
  for (const e of active) {
    const day = dayNumber(new Date(e.at))
    xp += XP[e.result]
    if (today - day < 7) weekXp += XP[e.result]
    activeDays.add(day)
    reviewsPerDay.set(day, (reviewsPerDay.get(day) ?? 0) + 1)
    if (e.result === 'wrong') continue
    if (!knownPerDay.has(day)) knownPerDay.set(day, new Set())
    knownPerDay.get(day)!.add(e.word_id)
  }

  const days = [...activeDays].sort((a, b) => a - b)
  let bestStreak = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
  }
  let streak = 0
  const last = days[days.length - 1]
  if (last !== undefined && today - last <= 1) {
    streak = 1
    for (let i = days.length - 1; i > 0 && days[i] === days[i - 1] + 1; i--) streak++
  }

  return {
    xp,
    weekXp,
    level: levelInfo(xp),
    streak,
    bestStreak,
    todayWords: knownPerDay.get(today)?.size ?? 0,
    yesterdayWords: knownPerDay.get(today - 1)?.size ?? 0,
    reviews: active.length,
    goalDays: [...knownPerDay.values()].filter((s) => s.size >= dailyGoal).length,
    activeDays,
    reviewsPerDay,
  }
}

export type BadgeStats = Stats & { maxBox: number }

export interface Badge {
  id: string
  icon: string
  title: string
  description: string
  // Aktueller Wert und Ziel, daraus ergeben sich „erreicht" und der Fortschritt.
  progress: (s: BadgeStats) => [current: number, target: number]
}

const badge = (id: string, icon: string, title: string, description: string, value: (s: BadgeStats) => number, target: number): Badge => ({
  id,
  icon,
  title,
  description,
  progress: (s) => [Math.min(value(s), target), target],
})

export const BADGES: Badge[] = [
  badge('start', '🌱', 'Erster Schritt', 'Die erste Abfrage', (s) => s.reviews, 1),
  badge('r100', '💯', 'Hundert', '100 Abfragen', (s) => s.reviews, 100),
  badge('r1000', '🏆', 'Tausend', '1000 Abfragen', (s) => s.reviews, 1000),
  badge('goal1', '🎯', 'Ziel erreicht', 'Tagesziel einmal geschafft', (s) => s.goalDays, 1),
  badge('goal10', '🎖️', 'Zielsicher', 'Tagesziel an 10 Tagen', (s) => s.goalDays, 10),
  badge('streak3', '🔥', 'Dranbleiben', '3 Tage in Folge', (s) => s.bestStreak, 3),
  badge('streak7', '📅', 'Eine Woche', '7 Tage in Folge', (s) => s.bestStreak, 7),
  badge('streak30', '🌟', 'Ein Monat', '30 Tage in Folge', (s) => s.bestStreak, 30),
  badge('level5', '⭐', 'Level 5', 'Level 5 erreicht', (s) => s.level.level, 5),
  badge('level10', '🚀', 'Level 10', 'Level 10 erreicht', (s) => s.level.level, 10),
  badge('box5', '🧠', 'Sitzt!', 'Eine Karte in Fach 5', (s) => (s.maxBox >= 5 ? 1 : 0), 1),
]

export function earned(b: Badge, s: BadgeStats): boolean {
  const [cur, target] = b.progress(s)
  return cur >= target
}
