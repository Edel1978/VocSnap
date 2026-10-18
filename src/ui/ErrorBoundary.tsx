import { Component, type ReactNode } from 'react'
import { Mascot } from './Mascot'
import { button, primary } from './ui'

// Fängt Abstürze einer Seite ab. Ohne das bliebe der Bildschirm weiß, und die installierte App hat keinen Neu-laden-Knopf.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Mascot mood="sleepy" className="w-32" />
        <h1 className="mt-3 text-2xl font-bold">Hoppla, da ist etwas schiefgegangen</h1>
        <p className="mt-1 max-w-xs text-slate-600 dark:text-slate-300">Deine Daten sind sicher. Lade die App neu und versuch es nochmal.</p>
        <button type="button" className={`${primary} mt-5 w-full max-w-xs`} onClick={() => location.reload()}>
          Neu laden
        </button>
        {/* Seitenwechsel setzt die Fehleranzeige zurück (key = Pfad). */}
        <a href="#/einstellungen/daten" className={`${button} mt-2 w-full max-w-xs py-3`}>
          Daten sichern
        </a>
      </div>
    )
  }
}
