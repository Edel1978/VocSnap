import { describe, expect, it } from 'vitest'
import { planExam, type PlanCard } from './examPlan'

const INTERVALS = [1, 2, 4, 8, 16]
const now = new Date(2026, 4, 10, 15, 0)
const iso = (d: number, h = 9) => new Date(2026, 4, d, h, 0).toISOString()

const fresh = (n: number): PlanCard[] => Array.from({ length: n }, (_, i) => ({ key: `k${i}`, state: undefined }))
const seen = (key: string, box: number, first: string, last = first): PlanCard => ({
  key,
  state: { box, firstAt: first, lastAt: last },
})

describe('Lernplan zur Klassenarbeit', () => {
  it('verteilt neue Karten gleichmäßig, der letzte Tag ist Generalprobe', () => {
    // Arbeit am 15.: Tage 10.–14., neue Karten auf 10.–13.
    const plan = planExam(fresh(10), '2026-05-15', INTERVALS, now)
    expect(plan.daysLeft).toBe(5)
    expect(plan.days.map((d) => d.newCount)).toEqual([3, 3, 2, 2, 0])
    expect(plan.days.map((d) => d.finalReview)).toEqual([false, false, false, false, true])
    expect(plan.todayKeys.size).toBe(3)
    expect(plan.openToday).toBe(3)
  })

  it('verschiebt die Tagesquote nicht, während heute gelernt wird', () => {
    const cards = [seen('a', 2, iso(10)), seen('b', 1, iso(10)), seen('c', 2, iso(10)), ...fresh(7)]
    const plan = planExam(cards, '2026-05-15', INTERVALS, now)
    expect([...plan.todayKeys].sort()).toEqual(['a', 'b', 'c'])
    expect(plan.openToday).toBe(0)
  })

  it('nimmt fällige Karten dazu', () => {
    const cards = [seen('alt', 1, iso(8), iso(9)), seen('spaeter', 3, iso(8), iso(9)), ...fresh(4)]
    const plan = planExam(cards, '2026-05-15', INTERVALS, now)
    expect(plan.todayKeys.has('alt')).toBe(true)
    expect(plan.todayKeys.has('spaeter')).toBe(false)
    expect(plan.todayKeys.size).toBe(2)
  })

  it('fragt am letzten Tag alles ab', () => {
    const cards = [seen('a', 5, iso(1)), ...fresh(2)]
    const plan = planExam(cards, '2026-05-11', INTERVALS, now)
    expect(plan.daysLeft).toBe(1)
    expect(plan.todayKeys.size).toBe(3)
    expect(plan.days).toEqual([{ offset: 0, newCount: 3 - 1, finalReview: true }])
  })

  it('Vokabeltest: Generalprobe nur mit neuen und unsicheren Karten', () => {
    const cards = [seen('sicher', 4, iso(1)), seen('wackelt', 2, iso(1)), ...fresh(1)]
    const plan = planExam(cards, '2026-05-11', INTERVALS, now, true)
    expect([...plan.todayKeys].sort()).toEqual(['k0', 'wackelt'])
  })

  it('am Tag der Arbeit nur unsichere Karten, danach nichts mehr', () => {
    const cards = [seen('sicher', 4, iso(1)), seen('wackelig', 1, iso(1)), ...fresh(1)]
    const today = planExam(cards, '2026-05-10', INTERVALS, now)
    expect(today.daysLeft).toBe(0)
    expect([...today.todayKeys].sort()).toEqual(['k0', 'wackelig'])
    const past = planExam(cards, '2026-05-09', INTERVALS, now)
    expect(past.daysLeft).toBe(-1)
    expect(past.todayKeys.size).toBe(0)
  })

  it('kommt ohne Karten aus', () => {
    const plan = planExam([], '2026-05-15', INTERVALS, now)
    expect(plan.todayKeys.size).toBe(0)
    expect(plan.days.every((d) => d.newCount === 0)).toBe(true)
  })
})
