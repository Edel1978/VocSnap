import { useEffect, useState } from 'react'

// Zahlenfeld, das sich beim Tippen auch leeren lässt. Übernommen werden nur ganze Zahlen ab min,
// beim Verlassen springt ein ungültiger Wert auf den gespeicherten zurück.
export function NumberField(props: {
  value: number
  min?: number
  max?: number
  onChange: (n: number) => void
  className?: string
  'aria-label'?: string
}) {
  const { value, min = 1, max = 999 } = props
  const [text, setText] = useState(String(value))

  useEffect(() => setText(String(value)), [value])

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={props['aria-label']}
      className={props.className}
      value={text}
      onChange={(e) => {
        const t = e.target.value.replace(/\D/g, '')
        setText(t)
        const n = Number(t)
        if (t !== '' && n >= min && n <= max) props.onChange(n)
      }}
      onBlur={() => setText(String(value))}
    />
  )
}
