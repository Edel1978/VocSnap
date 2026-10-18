import { Link } from 'react-router-dom'
import { languageColor } from '../../config/languages'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { Icon } from '../icons'
import { card, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

// „Foto scannen" von der Startseite: erst die Lektion wählen, in die die Wörter kommen.
export function ScanPickPage() {
  const { store, profile } = useApp()
  const [lessons] = useAsync(async () => {
    const list = profile ? await store.listLessons(profile.id) : []
    return list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }, [store, profile])

  if (lessons.state === 'loading') return <Loading />
  if (lessons.state === 'error') return <ErrorBox />

  return (
    <Section title="In welche Lektion?">
      {lessons.data.length === 0 ? (
        <>
          <p className={muted}>Leg zuerst eine Lektion an, dann kannst du Fotos hineinscannen.</p>
          <Link to="/lektion/neu" className={`${primary} mt-3 block`}>
            Neue Lektion
          </Link>
        </>
      ) : (
        <ul className="space-y-2">
          {lessons.data.map((l) => (
            <li key={l.id}>
              <Link
                to={`/lektion/${l.id}/scan`}
                className={`${card} flex items-center gap-3 border-l-[6px] py-3`}
                style={{ borderLeftColor: languageColor(l.source_lang) }}
              >
                <Icon name="camera" className="size-5 text-indigo-500" />
                <span className="flex-1 font-display font-medium">{l.title}</span>
                <Icon name="chevron" className="size-5 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
