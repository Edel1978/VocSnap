import { describe, expect, it } from 'vitest'
import { backupDue, daysSince } from './backup'

const now = new Date('2026-10-18T12:00:00Z')

describe('Sicherungs-Erinnerung', () => {
  it('erst ab 20 Wörtern', () => {
    expect(backupDue(null, 19, now)).toBe(false)
    expect(backupDue(null, 20, now)).toBe(true)
  })

  it('nach 14 Tagen erneut', () => {
    expect(backupDue('2026-10-05T12:00:00Z', 50, now)).toBe(false)
    expect(backupDue('2026-10-04T12:00:00Z', 50, now)).toBe(true)
    expect(daysSince('2026-10-11T13:00:00Z', now)).toBe(6)
  })
})
