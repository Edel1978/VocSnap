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
  reviews: number
  // Tage, an denen das Tagesziel erreicht wurde.
  goalDays: number
}

// Berechnet alle Kennzahlen aus den Ereignissen.
export function computeStats(events: ReviewEvent[], dailyGoal: number, now: Date = new Date()): Stats {
  const active = events.filter((e) => e.deleted_at === null)
  const today = dayNumber(now)
  // Nur gewusste Wörter zählen fürs Tagesziel, aktive Tage (Streak) zählen jede Abfrage.
  const knownPerDay = new Map<number, Set<string>>()
  const activeDays = new Set<number>()
  let xp = 0
  let weekXp = 0
  for (const e of active) {
    const day = dayNumber(new Date(e.at))
    xp += XP[e.result]
    if (today - day < 7) weekXp += XP[e.result]
    activeDays.add(day)
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
    reviews: active.length,
    goalDays: [...knownPerDay.values()].filter((s) => s.size >= dailyGoal).length,
  }
}

export interface Badge {
  id: string
  icon: string
  title: string
  description: string
  earned: (s: Stats & { maxBox: number }) => boolean
}

export const BADGES: Badge[] = [
  { id: 'start', icon: '🌱', title: 'Erster Schritt', description: 'Die erste Abfrage', earned: (s) => s.reviews >= 1 },
  { id: 'r100', icon: '💯', title: 'Hundert', description: '100 Abfragen', earned: (s) => s.reviews >= 100 },
  { id: 'r1000', icon: '🏆', title: 'Tausend', description: '1000 Abfragen', earned: (s) => s.reviews >= 1000 },
  { id: 'goal1', icon: '🎯', title: 'Ziel erreicht', description: 'Tagesziel einmal geschafft', earned: (s) => s.goalDays >= 1 },
  { id: 'goal10', icon: '🎖️', title: 'Zielsicher', description: 'Tagesziel an 10 Tagen', earned: (s) => s.goalDays >= 10 },
  { id: 'streak3', icon: '🔥', title: 'Dranbleiben', description: '3 Tage in Folge', earned: (s) => s.bestStreak >= 3 },
  { id: 'streak7', icon: '📅', title: 'Eine Woche', description: '7 Tage in Folge', earned: (s) => s.bestStreak >= 7 },
  { id: 'streak30', icon: '🌟', title: 'Ein Monat', description: '30 Tage in Folge', earned: (s) => s.bestStreak >= 30 },
  { id: 'level5', icon: '⭐', title: 'Level 5', description: 'Level 5 erreicht', earned: (s) => s.level.level >= 5 },
  { id: 'level10', icon: '🚀', title: 'Level 10', description: 'Level 10 erreicht', earned: (s) => s.level.level >= 10 },
  { id: 'box5', icon: '🧠', title: 'Sitzt!', description: 'Eine Karte in Fach 5', earned: (s) => s.maxBox >= 5 },
]
