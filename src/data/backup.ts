// Erinnerung ans Sichern: ab 20 Wörtern, wenn noch nie oder vor mindestens 14 Tagen gesichert wurde.
export const BACKUP_DAYS = 14
const MIN_WORDS = 20

export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(iso)) / 86_400_000)
}

export function backupDue(lastBackup: string | null, words: number, now: Date = new Date()): boolean {
  if (words < MIN_WORDS) return false
  return !lastBackup || daysSince(lastBackup, now) >= BACKUP_DAYS
}
