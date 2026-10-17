import { Flashcard } from './flashcard/Flashcard'
import type { ModeId } from './modes'
import type { LearningMode } from './types'

// Neue Modi hier eintragen.
export const LEARNING_MODES: Partial<Record<ModeId, LearningMode>> = {
  flashcard: { id: 'flashcard', batchSize: 1, Component: Flashcard },
}
