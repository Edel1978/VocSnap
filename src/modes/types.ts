import type { ComponentType } from 'react'
import type { ReviewResult, Word } from '../data/types'
import type { StudyItem } from '../learn/session'
import type { Settings } from '../settings/settings'
import type { ModeId } from './modes'

export interface ModeResult {
  item: StudyItem
  result: ReviewResult
}

// Ein Modus bekommt einen Stapel (batchSize Abfragen) und meldet die Ergebnisse gesammelt zurück.
export interface ModeProps {
  items: StudyItem[]
  // Alle Wörter der Runde, z. B. für falsche Antworten im Multiple Choice.
  pool: Word[]
  settings: Settings
  onResults: (results: ModeResult[]) => void
}

export interface LearningMode {
  id: ModeId
  batchSize: number
  Component: ComponentType<ModeProps>
}
