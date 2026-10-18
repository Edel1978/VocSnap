import { useState, type FormEvent } from 'react'
import { input, primary } from './ui'

// Platzhalter-Avatare, bis es eigene Grafiken gibt.
export const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐙', '🦉', '🐨', '🐬', '🦄', '🐢', '🐝']

export function AvatarPicker({ value, onChange }: { value: string; onChange: (a: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1" role="radiogroup" aria-label="Avatar">
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={value === a}
          onClick={() => onChange(a)}
          className={`rounded-lg py-1 text-2xl ${value === a ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`}
        >
          {a}
        </button>
      ))}
    </div>
  )
}

export function ProfileForm({ label, onSubmit }: { label: string; onSubmit: (name: string, avatar: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSubmit(name.trim(), avatar)
      setName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <AvatarPicker value={avatar} onChange={setAvatar} />
      <input
        className={input}
        placeholder="Name oder Spitzname"
        aria-label="Name"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className={`${primary} w-full`} disabled={!name.trim() || busy}>
        {label}
      </button>
    </form>
  )
}
