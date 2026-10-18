import { describe, expect, it } from 'vitest'
import type { ReviewEvent } from '../data/types'
import { dayNumber } from './leitner'
import {
  BADGES,
  badgeCount,
  badgeProgress,
  computeStats,
  computeStreak,
  GOAL_BONUS,
  levelInfo,
  levelStep,
  PERFECT_BONUS,
  rankOf,
  xpForLevel,
  type BadgeStats,
} from './motivation'

let n = 0
const ev = (day: number, result: ReviewEvent['result'] = 'correct', word_id = 'w', hour = 12, minute = 0, mode = 'flashcard') =>
  ({ id: String(n++), word_id, result, mode, at: new Date(2026, 4, day, hour, minute).toISOString(), deleted_at: null }) as ReviewEvent
const now = new Date(2026, 4, 20, 18)
// Ziel 99, damit kein Tagesziel-Bonus die XP verfälscht.
const noGoal = 99

describe('Level', () => {
  it('Level 2 kommt schnell, danach wird es schwerer', () => {
    expect([1, 2, 3, 4, 5].map(levelStep)).toEqual([30, 100, 220, 360, 540])
    expect(xpForLevel(2)).toBe(30)
    expect(xpForLevel(5)).toBe(710)
    expect(xpForLevel(10)).toBe(5840)
    expect(levelInfo(0)).toEqual({ level: 1, current: 0, needed: 30 })
    expect(levelInfo(29).level).toBe(1)
    expect(levelInfo(30)).toEqual({ level: 2, current: 0, needed: 100 })
    expect(levelInfo(xpForLevel(12) + 5)).toEqual({ level: 12, current: 5, needed: levelStep(12) })
  })

  it('hat Ränge', () => {
    expect([1, 4, 5, 10, 15, 20, 29, 30, 50].map(rankOf)).toEqual([
      'Neuling',
      'Neuling',
      'Entdecker',
      'Wortsammler',
      'Sprachprofi',
      'Meister',
      'Meister',
      'Legende',
      'Legende',
    ])
  })
})

describe('Kennzahlen', () => {
  it('zählt XP nach Ergebnis und die Woche getrennt', () => {
    const s = computeStats([ev(20, 'correct'), ev(19, 'half'), ev(1, 'wrong'), ev(10, 'correct')], noGoal, now)
    expect(s.xp).toBe(26)
    expect(s.weekXp).toBe(15)
    expect(s.reviews).toBe(4)
    expect(s.reviewsPerDay.get(dayNumber(now))).toBe(1)
  })

  it('gibt Bonus für das Tagesziel', () => {
    const s = computeStats([ev(20, 'correct', 'a'), ev(1, 'correct', 'b')], 1, now)
    expect(s.goalDays).toBe(2)
    expect(s.xp).toBe(20 + 2 * GOAL_BONUS)
    expect(s.weekXp).toBe(10 + GOAL_BONUS)
  })

  it('gibt Bonus für fehlerfreie Runden ab 10 Abfragen', () => {
    const round = (day: number, results: ReviewEvent['result'][], mode = 'flashcard') =>
      results.map((r, i) => ev(day, r, `w${i}`, 12, i, mode))
    const ten = Array<ReviewEvent['result']>(10).fill('correct')
    expect(computeStats(round(20, ten), noGoal, now).perfectRounds).toBe(1)
    expect(computeStats(round(20, ten), noGoal, now).xp).toBe(100 + PERFECT_BONUS)
    // Halb ist kein Fehler, falsch schon.
    expect(computeStats(round(20, [...ten.slice(1), 'half']), noGoal, now).perfectRounds).toBe(1)
    expect(computeStats(round(20, [...ten.slice(1), 'wrong']), noGoal, now).perfectRounds).toBe(0)
    expect(computeStats(round(20, ten.slice(1)), noGoal, now).perfectRounds).toBe(0)
    // Modus- oder Tageswechsel trennt Runden.
    expect(computeStats([...round(19, ten), ...round(20, ten)], noGoal, now).perfectRounds).toBe(2)
    expect(computeStats([...round(20, ten.slice(5)), ...round(20, ten.slice(5), 'typing')], noGoal, now).perfectRounds).toBe(0)
  })

  it('Tagesziel zählt nur gewusste Wörter', () => {
    const s = computeStats([ev(20, 'wrong', 'a'), ev(20, 'wrong', 'b'), ev(20, 'half', 'c')], 1, now)
    expect(s.todayWords).toBe(1)
    expect(computeStats([ev(20, 'wrong', 'a')], 1, now)).toMatchObject({ todayWords: 0, goalDays: 0, streak: 1 })
  })

  it('Tagesziel zählt verschiedene Wörter', () => {
    const today = [ev(20, 'correct', 'a'), ev(20, 'wrong', 'a'), ev(20, 'correct', 'b')]
    const s = computeStats([...today, ev(19, 'correct', 'a'), ev(19, 'correct', 'b')], 2, now)
    expect(s.todayWords).toBe(2)
    expect(s.goalDays).toBe(2)
    expect(computeStats(today, 3, now).goalDays).toBe(0)
  })

  it('ignoriert gelöschte Ereignisse', () => {
    expect(computeStats([{ ...ev(20), deleted_at: 'x' }], 20, now).reviews).toBe(0)
  })

  it('erkennt Uhrzeiten, Lernmodi und Comeback', () => {
    const s = computeStats([ev(1, 'correct', 'a', 6), ev(9, 'correct', 'a', 22, 30, 'typing')], noGoal, now)
    expect(s).toMatchObject({ earlyBird: true, nightOwl: true, comeback: true, modesUsed: 2 })
    expect(computeStats([ev(1), ev(8)], noGoal, now).comeback).toBe(false)
  })
})

describe('Streak', () => {
  const t = 100

  it('zählt bis heute oder gestern', () => {
    expect(computeStreak([98, 99, 100], t).streak).toBe(3)
    expect(computeStreak([97, 98, 99], t).streak).toBe(3)
    expect(computeStreak([], t)).toMatchObject({ streak: 0, best: 0, freezesLeft: 2 })
  })

  it('überbrückt bis zu zwei verpasste Tage in 30 Tagen', () => {
    // Ein Tag Lücke: Schutztag, Serie läuft weiter (Schutztage zählen nicht mit).
    expect(computeStreak([96, 97, 99, 100], t)).toMatchObject({ streak: 4, freezesLeft: 1 })
    // Zwei einzelne Lücken.
    expect(computeStreak([94, 96, 98, 99, 100], t)).toMatchObject({ streak: 5, freezesLeft: 0 })
    // Dritte Lücke im selben Zeitraum reißt die Serie.
    expect(computeStreak([92, 94, 96, 98, 99], t)).toMatchObject({ streak: 2, best: 3 })
    expect(computeStreak([92, 94, 96, 98], t).streak).toBe(0)
    // Gestern und vorgestern verpasst: noch gerettet.
    expect(computeStreak([95, 96, 97], t)).toMatchObject({ streak: 3, freezesLeft: 0 })
  })

  it('verbraucht keine Schutztage für zu lange Lücken', () => {
    expect(computeStreak([90, 91, 95, 96], t)).toMatchObject({ streak: 0, best: 2, freezesLeft: 2 })
    expect(computeStreak([90, 91, 95, 99], t)).toMatchObject({ streak: 1, best: 2, freezesLeft: 2 })
  })

  it('Schutztage werden nach 30 Tagen wieder frei', () => {
    const days = [50, 52, 54, ...Array.from({ length: 47 }, (_, i) => 54 + i)].filter((d, i, a) => a.indexOf(d) === i)
    const s = computeStreak(days, t)
    expect(s.frozen).toEqual(new Set([51, 53]))
    expect(s.streak).toBe(days.length)
    expect(s.freezesLeft).toBe(2)
    // Innerhalb von 30 Tagen wäre die dritte Lücke zu viel, nach 30 Tagen nicht mehr.
    expect(computeStreak([60, 62, 64, 66], 66).streak).toBe(1)
    expect(computeStreak([60, 62, 64, 92, 94], 94).streak).toBe(2)
    expect(computeStreak([60, 62, 64, ...Array.from({ length: 30 }, (_, i) => 64 + i), 95], 95).frozen.has(94)).toBe(true)
  })
})

describe('Abzeichen', () => {
  const stats = (extra: Partial<BadgeStats> = {}): BadgeStats => ({
    ...computeStats([ev(18), ev(19), ev(20)], 1, now),
    topBoxCards: 0,
    words: 0,
    examsPrepared: 0,
    ...extra,
  })

  it('haben Stufen', () => {
    const reviews = BADGES.find((b) => b.id === 'reviews')!
    expect(badgeProgress(reviews, stats())).toEqual({ tier: 0, value: 3, next: 100 })
    expect(badgeProgress(reviews, stats({ reviews: 600 }))).toEqual({ tier: 2, value: 600, next: 2000 })
    expect(badgeProgress(reviews, stats({ reviews: 10000 }))).toEqual({ tier: 4, value: 10000, next: undefined })
  })

  it('werden aus den Kennzahlen vergeben', () => {
    const s = stats({ topBoxCards: 1, words: 20 })
    const earned = BADGES.filter((b) => badgeProgress(b, s).tier > 0).map((b) => b.id)
    expect(earned).toEqual(['streak', 'goal', 'box5', 'words'])
    expect(badgeCount(s)).toEqual({ earned: 4, total: BADGES.reduce((n, b) => n + b.targets.length, 0) })
  })
})
