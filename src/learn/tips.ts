// Was Snappy auf der Startseite sagt. Reine Funktion, damit sie testbar bleibt.
export interface TipInput {
  words: number
  due: number
  todayWords: number
  goal: number
  streak: number
  yesterdayKnown: number
  hour: number
}

export function snappySays(t: TipInput): string {
  if (t.words === 0) return 'Hi! Leg eine Lektion an, dann lernen wir zusammen.'
  if (t.todayWords >= t.goal && t.due === 0) return 'Alles erledigt und Tagesziel geschafft. Stark!'
  if (t.todayWords >= t.goal) return 'Tagesziel geschafft! Wer mag, übt noch ein bisschen.'
  if (t.todayWords > 0) return `Noch ${t.goal - t.todayWords} Wörter bis zum Tagesziel. Du schaffst das!`
  if (t.streak >= 3) return `${t.streak} Tage in Folge! Lass die Serie heute nicht reißen.`
  if (t.yesterdayKnown >= 10) return `Gestern ${t.yesterdayKnown} Wörter gewusst. Mach heute weiter so!`
  if (t.due === 0) return 'Heute ist nichts fällig. Zeit für neue Wörter?'
  if (t.hour >= 20) return 'Kurz vor dem Schlafen lernen hilft beim Merken. 5 Minuten?'
  return `Heute sind ${t.due} Wörter dran. Nur ein paar Minuten?`
}
