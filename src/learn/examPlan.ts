import { dayNumber, isDue, type CardState } from './leitner'

export interface PlanCard {
  key: string
  state: CardState | undefined
}

export interface PlanDay {
  // Tage ab heute (0 = heute).
  offset: number
  newCount: number
  // Letzter Tag vor der Arbeit: alles noch einmal.
  finalReview: boolean
}

export interface ExamPlan {
  // Tage bis zur Arbeit (0 = heute ist die Arbeit, negativ = vorbei).
  daysLeft: number
  days: PlanDay[]
  // Karten, die heute dran sind (neue Karten nach Quote, fällige Karten, am letzten Tag alle).
  todayKeys: Set<string>
  // Davon heute noch nicht abgefragt.
  openKeys: Set<string>
  openToday: number
  unseen: number
}

// Datum im Format JJJJ-MM-TT als lokaler Tag.
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Erstellt den Plan bis zum Tag der Arbeit aus dem Leitner-Stand.
// Neue Karten werden gleichmäßig auf die Tage vor dem letzten Tag verteilt, der letzte Tag ist Generalprobe.
// quickFinal (Vokabeltest): Generalprobe nur mit neuen und unsicheren Karten (Fach 1–2).
export function planExam(
  cards: PlanCard[],
  examDate: string,
  intervals: number[],
  now: Date = new Date(),
  quickFinal = false,
): ExamPlan {
  const today = dayNumber(now)
  const daysLeft = dayNumber(parseDay(examDate)) - today
  const seenToday = (c: PlanCard) => c.state !== undefined && dayNumber(new Date(c.state.lastAt)) === today
  const firstToday = (c: PlanCard) => c.state !== undefined && dayNumber(new Date(c.state.firstAt)) === today
  const unseenCards = cards.filter((c) => !c.state)

  if (daysLeft <= 0) {
    // Am Tag der Arbeit nur noch die unsicheren Karten, danach ist der Plan vorbei.
    const keys = daysLeft === 0 ? cards.filter((c) => !c.state || c.state.box <= 2).map((c) => c.key) : []
    const open = new Set(cards.filter((c) => keys.includes(c.key) && !seenToday(c)).map((c) => c.key))
    return { daysLeft, days: [], todayKeys: new Set(keys), openKeys: open, openToday: open.size, unseen: unseenCards.length }
  }

  // Tage für neue Karten: alle außer dem letzten, außer es bleibt nur einer.
  const newDays = daysLeft > 1 ? daysLeft - 1 : 1
  // Bestand zu Beginn des Tages, damit sich die Tagesquote beim Lernen nicht verschiebt.
  const startedToday = cards.filter(firstToday)
  const unseenAtStart = unseenCards.length + startedToday.length
  const quotaToday = Math.ceil(unseenAtStart / newDays)
  const finalToday = daysLeft === 1

  const todayKeys = new Set<string>()
  if (finalToday) {
    cards.filter((c) => !quickFinal || !c.state || c.state.box <= 2).forEach((c) => todayKeys.add(c.key))
  } else {
    startedToday.forEach((c) => todayKeys.add(c.key))
    unseenCards.slice(0, Math.max(0, quotaToday - startedToday.length)).forEach((c) => todayKeys.add(c.key))
    cards.filter((c) => c.state && isDue(c.state, intervals, now)).forEach((c) => todayKeys.add(c.key))
  }

  const days: PlanDay[] = []
  let remaining = unseenAtStart
  for (let offset = 0; offset < daysLeft; offset++) {
    const final = offset === daysLeft - 1 && daysLeft > 1
    const slots = Math.max(1, newDays - offset)
    const count = final ? 0 : Math.min(remaining, Math.ceil(remaining / slots))
    remaining -= count
    days.push({ offset, newCount: count, finalReview: final || (daysLeft === 1 && offset === 0) })
  }

  const openKeys = new Set(cards.filter((c) => todayKeys.has(c.key) && !seenToday(c)).map((c) => c.key))
  return { daysLeft, days, todayKeys, openKeys, openToday: openKeys.size, unseen: unseenCards.length }
}
