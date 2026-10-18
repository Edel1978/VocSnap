import { useState } from 'react'
import type { Profile } from '../../data/types'
import { useApp } from '../AppContext'
import { Loading, Section, StorageError } from '../components'
import { AvatarPicker, ProfileForm } from '../ProfileForm'
import { button, danger, input } from '../ui'

export function ProfilesPage() {
  const { profiles, profile, store, updateSettings, reloadProfiles } = useApp()

  if (profiles.state === 'loading') return <Loading />
  if (profiles.state === 'error') return <StorageError />

  return (
    <div className="space-y-4">
      <Section title="Profile">
        <ul className="space-y-2">
          {profiles.list.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              active={p.id === profile?.id}
              onSelect={() => updateSettings({ activeProfileId: p.id })}
              onRename={async (name, avatar) => {
                await store.updateProfile(p.id, { name, avatar })
                await reloadProfiles()
              }}
              onDelete={async () => {
                await store.deleteProfile(p.id)
                await reloadProfiles()
              }}
            />
          ))}
        </ul>
      </Section>
      <Section title="Neues Profil">
        <ProfileForm
          label="Anlegen"
          onSubmit={async (name, avatar) => {
            const p = await store.createProfile({ name, avatar })
            updateSettings({ activeProfileId: p.id })
            await reloadProfiles()
          }}
        />
      </Section>
    </div>
  )
}

function ProfileRow(props: {
  profile: Profile
  active: boolean
  onSelect: () => void
  onRename: (name: string, avatar: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const { profile, active } = props
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [avatar, setAvatar] = useState(profile.avatar)

  if (editing) {
    return (
      <li className="space-y-2">
        <AvatarPicker value={avatar} onChange={setAvatar} />
        <div className="flex gap-2">
          <input className={input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <button
            type="button"
            className={button}
            disabled={!name.trim()}
            onClick={async () => {
              await props.onRename(name.trim(), avatar)
              setEditing(false)
            }}
          >
            OK
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={props.onSelect}
        className={`flex-1 rounded-lg px-3 py-2 text-left ${
          active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        <span aria-hidden="true">{profile.avatar || '🙂'}</span> {profile.name}
        {active && <span className="ml-2 text-sm opacity-80">aktiv</span>}
      </button>
      <button type="button" className={button} onClick={() => setEditing(true)}>
        Ändern
      </button>
      <button
        type="button"
        className={danger}
        onClick={() => {
          if (confirm(`Profil „${profile.name}" mit allen Lektionen löschen?`)) void props.onDelete()
        }}
      >
        Löschen
      </button>
    </li>
  )
}
