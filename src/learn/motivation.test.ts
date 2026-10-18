import { describe, expect, it } from 'vitest'
import type { ReviewEvent } from '../data/types'
import { BADGES, computeStats, levelInfo, xpForLevel } from './motivation'

let n = 0
const ev = (day: number, result: ReviewEvent['result'] = 'correct', word_id = 'w') =>
  ({ id: String(n++), word_id, result, at: new Date(2026, 4, day, 12).toISOString(), deleted_at: null }) as ReviewEvent
const now = new Date(2026, 4, 20, 18)

describe('Level', () => {
  it('wächst mit den XP', () => {
    expect(levelInfo(0)).toEqual({ level: 1, current: 0, needed: 50 })
    expect(levelInfo(49).level).toBe(1)
    expect(levelInfo(50)).toEqual({ level: 2, current: 0, needed: 150 })
    expect(levelInfo(xpForLevel(5) + 10).level).toBe(5)
  })
})

describe('Kennzahlen', () => {
  it('zählt XP nach Ergebnis und die Woche getrennt', () => {
    const s = computeStats([ev(20, 'correct'), ev(19, 'half'), ev(1, 'wrong'), ev(10, 'correct')], 20, now)
    expect(s.xp).toBe(26)
    expect(s.weekXp).toBe(15)
    expect(s.reviews).toBe(4)
  })

  it('Streak zählt bis heute oder gestern, sonst 0', () => {
    expect(computeStats([ev(18), ev(19), ev(20)], 20, now).streak).toBe(3)
    expect(computeStats([ev(17), ev(18), ev(19)], 20, now).streak).toBe(3)
    expect(computeStats([ev(16), ev(17), ev(18)], 20, now).streak).toBe(0)
    expect(computeStats([ev(10), ev(11), ev(12), ev(13), ev(19), ev(20)], 20, now)).toMatchObject({
      streak: 2,
      bestStreak: 4,
    })
    expect(computeStats([], 20, now)).toMatchObject({ streak: 0, bestStreak: 0, xp: 0 })
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
})

describe('Badges', () => {
  it('werden aus den Kennzahlen vergeben', () => {
    const s = { ...computeStats([ev(18), ev(19), ev(20)], 1, now), maxBox: 5 }
    const earned = BADGES.filter((b) => b.earned(s)).map((b) => b.id)
    expect(earned).toEqual(['start', 'goal1', 'streak3', 'box5'])
  })
})
