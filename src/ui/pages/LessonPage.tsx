import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { languageLabel } from '../../config/languages'
import type { Direction, Word } from '../../data/types'
import { BOXES, boxOf, cardKey, computeStates } from '../../learn/leitner'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { LessonForm } from '../LessonForm'
import { button, danger, muted, primary } from '../ui'
import { useAsync } from '../useAsync'
import { WordForm } from '../WordForm'

const DIRS: Direction[] = ['to_target', 'to_source']

export function NewLessonPage() {
  const { store, profile } = useApp()
  const navigate = useNavigate()
  if (!profile) return <ErrorBox>Bitte zuerst ein Profil anlegen.</ErrorBox>
  return (
    <Section title="Neue Lektion">
      <LessonForm
        submitLabel="Anlegen"
        onSubmit={async (l) => {
          const lesson = await store.createLesson({ ...l, profile_id: profile.id })
          navigate(`/lektion/${lesson.id}`, { replace: true })
        }}
      />
    </Section>
  )
}

export function LessonPage() {
  const { id = '' } = useParams()
  const { store, profile } = useApp()
  const navigate = useNavigate()
  const [editingLesson, setEditingLesson] = useState(false)
  const [editingWord, setEditingWord] = useState<string | null>(null)
  const [data, reload] = useAsync(async () => {
    const lesson = await store.getLesson(id)
    const words = lesson ? await store.listWords(id) : []
    words.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const states = computeStates(profile ? await store.listReviewEvents(profile.id) : [])
    // Karten je Fach, beide Richtungen zusammen.
    const boxes = Array.from({ length: BOXES }, () => 0)
    for (const w of words) for (const d of DIRS) boxes[boxOf(states.get(cardKey(w.id, d))) - 1]++
    return { lesson, words, boxes }
  }, [store, id, profile])

  if (data.state === 'loading') return <Loading />
  if (data.state === 'error') return <ErrorBox />
  const { lesson, words, boxes } = data.data
  if (!lesson) return <ErrorBox>Diese Lektion gibt es nicht mehr.</ErrorBox>

  return (
    <div className="space-y-4">
      <Section
        title="Lektion"
        action={
          <button type="button" className={button} onClick={() => setEditingLesson((e) => !e)}>
            {editingLesson ? 'Schließen' : 'Bearbeiten'}
          </button>
        }
      >
        {editingLesson ? (
          <div className="space-y-3">
            <LessonForm
              initial={lesson}
              submitLabel="Speichern"
              onSubmit={async (l) => {
                await store.updateLesson(lesson.id, l)
                setEditingLesson(false)
                reload()
              }}
            />
            <button
              type="button"
              className={danger}
              onClick={async () => {
                if (!confirm(`Lektion „${lesson.title}" mit allen Wörtern löschen?`)) return
                await store.deleteLesson(lesson.id)
                navigate('/', { replace: true })
              }}
            >
              Lektion löschen
            </button>
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold">{lesson.title}</p>
            <p className={muted}>
              {languageLabel(lesson.source_lang)} → {languageLabel(lesson.target_lang)} · {words.length} Wörter
            </p>
            {words.length > 0 && <BoxBar boxes={boxes} />}
          </>
        )}
      </Section>

      {words.length > 0 && (
        <Link to={`/lernen?lektionen=${lesson.id}`} className={`${primary} block`}>
          Diese Lektion lernen
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link to={`/lektion/${lesson.id}/scan`} className={`${button} py-3 text-center`}>
          Foto scannen
        </Link>
        <Link to={`/lektion/${lesson.id}/einfuegen`} className={`${button} py-3 text-center`}>
          Aus Text einfügen
        </Link>
      </div>

      <Section title="Wort hinzufügen">
        <WordForm
          submitLabel="Hinzufügen"
          onSubmit={async (w) => {
            await store.createWord({ ...w, lesson_id: lesson.id })
            reload()
          }}
        />
      </Section>

      <Section title={`Wörter (${words.length})`}>
        {words.length === 0 ? (
          <p className={muted}>Noch keine Wörter.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {words.map((w) =>
              editingWord === w.id ? (
                <li key={w.id} className="py-3">
                  <WordForm
                    initial={w}
                    submitLabel="Speichern"
                    onCancel={() => setEditingWord(null)}
                    onSubmit={async (patch) => {
                      await store.updateWord(w.id, patch)
                      setEditingWord(null)
                      reload()
                    }}
                  />
                </li>
              ) : (
                <WordRow
                  key={w.id}
                  word={w}
                  onEdit={() => setEditingWord(w.id)}
                  onDelete={async () => {
                    await store.deleteWord(w.id)
                    reload()
                  }}
                />
              ),
            )}
          </ul>
        )}
      </Section>
    </div>
  )
}

function BoxBar({ boxes }: { boxes: number[] }) {
  return (
    <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
      {boxes.map((n, i) => (
        <div key={i} className="rounded-lg bg-slate-100 py-1 dark:bg-slate-800">
          <div className="text-slate-500">Fach {i + 1}</div>
          <div className="text-base font-semibold">{n}</div>
        </div>
      ))}
    </div>
  )
}

function WordRow({ word, onEdit, onDelete }: { word: Word; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-2 py-2">
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <span className="block truncate font-medium">{word.term}</span>
        <span className={`block truncate ${muted}`}>{word.translation}</span>
      </button>
      <button
        type="button"
        className={danger}
        aria-label={`${word.term} löschen`}
        onClick={() => {
          if (confirm(`„${word.term}" löschen?`)) onDelete()
        }}
      >
        ✕
      </button>
    </li>
  )
}
