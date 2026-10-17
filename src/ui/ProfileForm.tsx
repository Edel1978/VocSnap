import { useState, type FormEvent } from 'react'
import { input, primary } from './ui'

export function ProfileForm({ label, onSubmit }: { label: string; onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSubmit(name.trim())
      setName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className={input}
        placeholder="Name oder Spitzname"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className={`${primary} py-2`} disabled={!name.trim() || busy}>
        {label}
      </button>
    </form>
  )
}
