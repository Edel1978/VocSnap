import { describe, expect, it } from 'vitest'
import { snappySays, type TipInput } from './tips'

const base: TipInput = { words: 20, due: 8, todayWords: 0, goal: 20, streak: 0, yesterdayKnown: 0, hour: 15 }

describe('snappySays', () => {
  it('hilft beim Start ohne Wörter', () => {
    expect(snappySays({ ...base, words: 0 })).toContain('Lektion')
  })
  it('lobt das Tagesziel', () => {
    expect(snappySays({ ...base, todayWords: 20, due: 0 })).toContain('Stark')
    expect(snappySays({ ...base, todayWords: 25 })).toContain('Tagesziel geschafft')
  })
  it('zählt bis zum Ziel', () => {
    expect(snappySays({ ...base, todayWords: 5 })).toContain('Noch 15')
  })
  it('erinnert an die Serie und an gestern', () => {
    expect(snappySays({ ...base, streak: 4 })).toContain('4 Tage')
    expect(snappySays({ ...base, yesterdayKnown: 12 })).toContain('Gestern 12')
  })
  it('sonst fällige Wörter oder Abendtipp', () => {
    expect(snappySays(base)).toContain('8 Wörter')
    expect(snappySays({ ...base, hour: 21 })).toContain('Schlafen')
    expect(snappySays({ ...base, due: 0 })).toContain('nichts fällig')
  })
})
