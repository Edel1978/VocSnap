import { prompt } from '../../learn/session'
import { AnswerInput } from '../shared/AnswerInput'
import type { ModeProps } from '../types'

export function Typing({ items, onResults }: ModeProps) {
  return (
    <AnswerInput items={items} onResults={onResults}>
      <p className="text-3xl font-semibold break-words">{prompt(items[0])}</p>
    </AnswerInput>
  )
}
