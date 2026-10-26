import type { ReviewEvent, ReviewResult } from '../data/types'
import { dayNumber } from './leitner'

export const XP: Record<ReviewResult, number> = { correct: 10, half: 5, wrong: 1 }
// Bonus je Tag mit erreichtem Tagesziel und je fehlerfreier Runde.
export const GOAL_BONUS = 50
export const PERFECT_BONUS = 20
// Fehlerfreie Runde: mindestens so viele Abfragen, keine falsch.
export const PERFECT_MIN = 10
// Abfragen im selben Modus mit höchstens dieser Pause gelten als eine Runde.
const ROUND_GAP_MS = 5 * 60_000

// Streak-Schutz: so viele verpasste Tage innerhalb von 30 Tagen reißen die Serie nicht.
export const STREAK_FREEZES = 2
export const FREEZE_WINDOW = 30

// XP von Level n nach n+1: Level 2 kommt schnell, danach wird jeder Schritt teurer.
export function levelStep(level: number): number {
  return Math.round((30 * level ** 1.8) / 10) * 10
}

// XP gesamt für Level n: Level 2 ab 30, Level 3 ab 130, Level 5 ab 710, Level 10 ab 5840 …
export function xpForLevel(level: number): number {
  let xp = 0
  for (let n = 1; n < level; n++) xp += levelStep(n)
  return xp
}

export interface LevelInfo {
  level: number
  // Fortschritt innerhalb des Levels.
  current: number
  needed: number
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  let base = 0
  while (xp >= base + levelStep(level)) base += levelStep(level++)
  return { level, current: Math.max(0, xp - base), needed: levelStep(level) }
}

const RANKS: [from: number, name: string][] = [
  [30, 'Legende'],
  [20, 'Meister'],
  [15, 'Sprachprofi'],
  [10, 'Wortsammler'],
  [5, 'Entdecker'],
  [1, 'Neuling'],
]

export function rankOf(level: number): string {
  return RANKS.find(([from]) => level >= from)![1]
}

export interface Stats {
  xp: number
  weekXp: number
  level: LevelInfo
  // Tage in Folge mit mindestens einer Abfrage, bis heute oder gestern. Schutztage überbrücken Lücken.
  streak: number
  bestStreak: number
  // Tage, die vom Streak-Schutz überbrückt wurden, und was davon in den letzten 30 Tagen noch frei ist.
  frozenDays: Set<number>
  freezesLeft: number
  // Verschiedene Wörter, die heute gewusst wurden (richtig oder halb). Grundlage für das Tagesziel.
  todayWords: number
  yesterdayWords: number
  reviews: number
  // Tage, an denen das Tagesziel erreicht wurde.
  goalDays: number
  perfectRounds: number
  // Tage mit mindestens einer Abfrage (dayNumber), z. B. für die Wochenleiste.
  activeDays: Set<number>
  // Abfragen je Tag (dayNumber), für den Lern-Kalender.
  reviewsPerDay: Map<number, number>
  modesUsed: number
  // Für geheime Abzeichen.
  earlyBird: boolean
  nightOwl: boolean
  comeback: boolean
}

// Serie mit Streak-Schutz. Eine Lücke wird nur überbrückt, wenn alle ihre Tage hineinpassen,
// sonst reißt die Serie, ohne Schutztage zu verbrauchen. Heute zählt erst, wenn gelernt wurde.
export function computeStreak(days: number[], today: number) {
  const frozen: number[] = []
  const fits = (gap: number[]) => {
    const all = [...frozen, ...gap]
    return gap.every((d) => all.filter((f) => f <= d && d - f < FREEZE_WINDOW).length <= STREAK_FREEZES)
  }
  const bridge = (from: number, to: number) => {
    const gap = Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i)
    if (!fits(gap)) return false
    frozen.push(...gap)
    return true
  }
  let run = 0
  let best = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && bridge(days[i - 1] + 1, days[i]) ? run + 1 : 1
    best = Math.max(best, run)
  }
  const last = days[days.length - 1]
  const streak = last !== undefined && bridge(last + 1, today) ? run : 0
  const used = frozen.filter((f) => today - f < FREEZE_WINDOW).length
  return { streak, best, frozen: new Set(frozen), freezesLeft: Math.max(0, STREAK_FREEZES - used) }
}

// Runden aus den Ereignissen: gleicher Modus, kurze Pausen. Zählt die fehlerfreien ab PERFECT_MIN Abfragen.
function perfectRoundDays(events: ReviewEvent[]): number[] {
  const days: number[] = []
  let size = 0
  let clean = true
  let prev: ReviewEvent | undefined
  const close = () => {
    if (prev && size >= PERFECT_MIN && clean) days.push(dayNumber(new Date(prev.at)))
  }
  for (const e of events) {
    const split = !prev || prev.mode !== e.mode || Date.parse(e.at) - Date.parse(prev.at) > ROUND_GAP_MS
    if (split) {
      close()
      size = 0
      clean = true
    }
    size++
    if (e.result === 'wrong') clean = false
    prev = e
  }
  close()
  return days
}

// Berechnet alle Kennzahlen aus den Ereignissen.
export function computeStats(events: ReviewEvent[], dailyGoal: number, now: Date = new Date()): Stats {
  const active = events.filter((e) => e.deleted_at === null).sort((a, b) => a.at.localeCompare(b.at))
  const today = dayNumber(now)
  const inWeek = (day: number) => today - day < 7
  // Nur gewusste Wörter zählen fürs Tagesziel, aktive Tage (Streak) zählen jede Abfrage.
  const knownPerDay = new Map<number, Set<string>>()
  const activeDays = new Set<number>()
  const reviewsPerDay = new Map<number, number>()
  const modes = new Set<string>()
  let xp = 0
  let weekXp = 0
  let earlyBird = false
  let nightOwl = false
  for (const e of active) {
    const at = new Date(e.at)
    const day = dayNumber(at)
    xp += XP[e.result]
    if (inWeek(day)) weekXp += XP[e.result]
    activeDays.add(day)
    reviewsPerDay.set(day, (reviewsPerDay.get(day) ?? 0) + 1)
    modes.add(e.mode)
    if (at.getHours() < 7) earlyBird = true
    if (at.getHours() >= 22) nightOwl = true
    if (e.result === 'wrong') continue
    if (!knownPerDay.has(day)) knownPerDay.set(day, new Set())
    knownPerDay.get(day)!.add(e.word_id)
  }

  const goalDayList = [...knownPerDay].filter(([, s]) => s.size >= dailyGoal).map(([d]) => d)
  const perfect = perfectRoundDays(active)
  for (const d of goalDayList) {
    xp += GOAL_BONUS
    if (inWeek(d)) weekXp += GOAL_BONUS
  }
  for (const d of perfect) {
    xp += PERFECT_BONUS
    if (inWeek(d)) weekXp += PERFECT_BONUS
  }

  const days = [...activeDays].sort((a, b) => a - b)
  const streak = computeStreak(days, today)

  return {
    xp,
    weekXp,
    level: levelInfo(xp),
    streak: streak.streak,
    bestStreak: streak.best,
    frozenDays: streak.frozen,
    freezesLeft: streak.freezesLeft,
    todayWords: knownPerDay.get(today)?.size ?? 0,
    yesterdayWords: knownPerDay.get(today - 1)?.size ?? 0,
    reviews: active.length,
    goalDays: goalDayList.length,
    perfectRounds: perfect.length,
    activeDays,
    reviewsPerDay,
    modesUsed: modes.size,
    earlyBird,
    nightOwl,
    comeback: days.some((d, i) => i > 0 && d - days[i - 1] > 7),
  }
}

// Zusätzliche Werte, die nicht aus den Ereignissen allein kommen.
export type BadgeStats = Stats & {
  // Karten in Fach 5.
  topBoxCards: number
  words: number
  // Klassenarbeiten, bei denen vorher jedes Wort mindestens einmal geübt wurde.
  examsPrepared: number
}

export const TIER_NAMES = ['Bronze', 'Silber', 'Gold', 'Diamant']

export interface Badge {
  id: string
  icon: string
  title: string
  // Beschreibung für eine Stufe, z. B. „100 Abfragen".
  describe: (target: number) => string
  value: (s: BadgeStats) => number
  // Ziele je Stufe, aufsteigend. Eine Stufe = einfaches Abzeichen.
  targets: number[]
  // Geheime Abzeichen sind erst sichtbar, wenn sie erreicht sind.
  secret?: boolean
}

const flag = (b: boolean) => (b ? 1 : 0)

export const BADGES: Badge[] = [
  { id: 'reviews', icon: '💯', title: 'Abfragen', describe: (n) => `${n} Abfragen`, value: (s) => s.reviews, targets: [100, 500, 2000, 10000] },
  { id: 'streak', icon: '🔥', title: 'Dranbleiben', describe: (n) => `${n} Tage in Folge`, value: (s) => s.bestStreak, targets: [3, 7, 30, 100] },
  { id: 'goal', icon: '🎯', title: 'Zielsicher', describe: (n) => (n === 1 ? 'Tagesziel geschafft' : `Tagesziel an ${n} Tagen`), value: (s) => s.goalDays, targets: [1, 10, 50, 150] },
  { id: 'level', icon: '⭐', title: 'Aufsteiger', describe: (n) => `Level ${n} erreicht`, value: (s) => s.level.level, targets: [5, 10, 20, 30] },
  { id: 'box5', icon: '🧠', title: 'Sitzt!', describe: (n) => (n === 1 ? 'Eine Karte in Fach 5' : `${n} Karten in Fach 5`), value: (s) => s.topBoxCards, targets: [1, 50, 250, 1000] },
  { id: 'words', icon: '📸', title: 'Sammler', describe: (n) => `${n} Wörter angelegt`, value: (s) => s.words, targets: [20, 100, 500, 2000] },
  { id: 'perfect', icon: '✨', title: 'Fehlerfrei', describe: (n) => (n === 1 ? 'Eine Runde ohne Fehler' : `${n} Runden ohne Fehler`), value: (s) => s.perfectRounds, targets: [1, 10, 50, 200] },
  { id: 'modes', icon: '🎮', title: 'Allrounder', describe: () => 'Alle 5 Lernmodi ausprobiert', value: (s) => s.modesUsed, targets: [5] },
  { id: 'early', icon: '🌅', title: 'Frühaufsteher', describe: () => 'Vor 7 Uhr gelernt', value: (s) => flag(s.earlyBird), targets: [1], secret: true },
  { id: 'night', icon: '🦉', title: 'Nachteule', describe: () => 'Nach 22 Uhr gelernt', value: (s) => flag(s.nightOwl), targets: [1], secret: true },
  { id: 'comeback', icon: '💪', title: 'Comeback', describe: () => 'Nach über einer Woche Pause wieder gelernt', value: (s) => flag(s.comeback), targets: [1], secret: true },
  { id: 'exam', icon: '📝', title: 'Gut vorbereitet', describe: () => 'Vor einem Test oder einer Arbeit jedes Wort geübt', value: (s) => s.examsPrepared, targets: [1], secret: true },
]

export interface BadgeProgress {
  // Erreichte Stufen (0 = noch keine).
  tier: number
  value: number
  // Ziel der nächsten Stufe, undefined wenn alle erreicht.
  next: number | undefined
}

export function badgeProgress(b: Badge, s: BadgeStats): BadgeProgress {
  const value = b.value(s)
  const tier = b.targets.filter((t) => value >= t).length
  return { tier, value, next: b.targets[tier] }
}

// Erreichte und mögliche Stufen über alle Abzeichen.
export function badgeCount(s: BadgeStats): { earned: number; total: number } {
  return BADGES.reduce(
    (acc, b) => ({ earned: acc.earned + badgeProgress(b, s).tier, total: acc.total + b.targets.length }),
    { earned: 0, total: 0 },
  )
}
