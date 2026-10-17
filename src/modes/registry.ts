import { MultipleChoice } from './choice/MultipleChoice'
import { Flashcard } from './flashcard/Flashcard'
import { ListenWrite } from './listen/ListenWrite'
import type { ModeId } from './modes'
import { Typing } from './typing/Typing'
import type { LearningMode } from './types'

// Neue Modi hier eintragen.
export const LEARNING_MODES: Partial<Record<ModeId, LearningMode>> = {
  flashcard: { id: 'flashcard', batchSize: 1, Component: Flashcard },
  multiple_choice: { id: 'multiple_choice', batchSize: 1, Component: MultipleChoice },
  typing: { id: 'typing', batchSize: 1, Component: Typing },
  listen_write: { id: 'listen_write', batchSize: 1, Component: ListenWrite },
}
