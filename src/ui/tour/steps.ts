import type { TourProgress } from '../../settings/settings'

// Wie ein Schritt weitergeht:
// button = Knopf in der Sprechblase, click = Tipp auf das markierte Element,
// route = Seitenwechsel zum nächsten Schritt, appear = Element des nächsten Schritts taucht auf.
// Unabhängig davon geht es immer weiter, wenn die Seite des nächsten Schritts erreicht ist.
export type Advance = 'button' | 'click' | 'route' | 'appear'

export interface TourStep {
  id: string
  // Seiten, auf denen der Schritt gilt (Pfad ohne #).
  path: RegExp
  // data-tour des markierten Elements. Ohne Ziel erscheint eine Karte in der Mitte.
  target?: string
  title?: string
  text: string
  advance: Advance
  button?: string
  // Seite bleibt bedienbar und wird nicht abgedunkelt (z. B. Formulare, Lernrunde).
  free?: boolean
}

const HOME = /^\/$/
const LESSON = /^\/lektion\/(?!neu$)[^/]+$/
// Auch die Unterseiten zum Hinzufügen gehören dazu, dort ist nur nichts markiert.
const LESSON_ADD = /^\/lektion\/(?!neu$)[^/]+(\/(einfuegen|scan))?$/
const LEARN = /^\/lernen$/
const ANY = /.*/

const welcome: TourStep = {
  id: 'welcome',
  path: HOME,
  title: 'Hallo, ich bin Snappy!',
  text: 'Ich zeige dir in ein paar Schritten, wie VocSnap funktioniert. Du machst alles gleich selbst.',
  advance: 'button',
  button: "Los geht's",
}

const homeSteps: TourStep[] = [
  {
    id: 'home-hero',
    path: HOME,
    target: 'hero',
    text: 'Hier steht, was heute dran ist. „Weiterlernen“ startet sofort mit den fälligen Wörtern, der Balken zeigt dein Tagesziel.',
    advance: 'button',
  },
  {
    id: 'home-stats',
    path: HOME,
    target: 'stats',
    text: 'Lernst du jeden Tag, wächst deine Serie. Keine Sorge: 2 Schutztage im Monat retten sie, wenn du mal aussetzt.',
    advance: 'button',
  },
]

const finish: TourStep[] = [
  {
    id: 'nav',
    path: ANY,
    target: 'nav',
    text: 'Unter „Lernen“ wählst du Lektionen und Lernmodi, unter „Erfolge“ findest du Level und Abzeichen. Unter „Mehr“ sicherst du deine Daten.',
    advance: 'button',
  },
  {
    id: 'done',
    path: ANY,
    title: 'Fertig!',
    text: 'Viel Spaß beim Lernen! Diese Anleitung findest du jederzeit unter „Mehr → Anleitung“.',
    advance: 'button',
    button: "Los geht's",
  },
]

// Neu in der App: einmal selbst eine Lektion anlegen, Wörter eintragen und eine Runde lernen.
export const FULL_TOUR: TourStep[] = [
  welcome,
  {
    id: 'new-lesson',
    path: HOME,
    target: 'new-lesson',
    text: 'Alles fängt mit einer Lektion an, zum Beispiel einer Unit aus deinem Buch. Tippe auf „Neue Lektion“.',
    advance: 'click',
  },
  {
    id: 'lesson-form',
    path: /^\/lektion\/neu$/,
    target: 'lesson-form',
    text: 'Gib der Lektion einen Namen, z. B. „Unit 1“, und wähle die Sprachen. Dann tippe auf „Anlegen“.',
    advance: 'route',
    free: true,
  },
  {
    id: 'add-tab',
    path: LESSON,
    target: 'add-tab',
    text: 'Jetzt kommen Wörter in deine Lektion. Tippe auf „Hinzufügen“.',
    advance: 'click',
  },
  {
    id: 'add-ways',
    path: LESSON_ADD,
    target: 'add-ways',
    text: 'Fotografiere die Vokabelliste aus dem Buch, füge Text ein oder trag Wörter von Hand ein. Zum Ausprobieren gibt es Beispielwörter.',
    advance: 'appear',
    free: true,
  },
  {
    id: 'learn-lesson',
    path: LESSON,
    target: 'learn-lesson',
    text: 'Super, deine ersten Wörter sind drin! Tippe auf „Diese Lektion lernen“.',
    advance: 'click',
  },
  {
    id: 'start-round',
    path: LEARN,
    target: 'start-round',
    text: 'Tippe hier, um die Runde zu starten. Weiter unten findest du andere Lernmodi: Multiple Choice, Tippen, Hören oder Paare finden.',
    advance: 'click',
  },
  {
    id: 'round',
    path: LEARN,
    target: 'round',
    text: 'Überleg dir die Antwort und prüfe sie dann. Was du weißt, wandert ein Fach weiter. Was nicht, kommt bald wieder.',
    advance: 'button',
    button: 'Verstanden',
    free: true,
  },
  {
    id: 'result',
    path: LEARN,
    target: 'reward',
    text: 'Geschafft! Für jede Antwort gibt es XP, damit steigst du im Level auf. Fehler kannst du direkt wiederholen.',
    advance: 'button',
  },
  {
    id: 'round-done',
    path: LEARN,
    target: 'round-done',
    text: 'Tippe auf „Fertig“, dann zeige ich dir noch die Startseite.',
    advance: 'click',
  },
  ...homeSteps,
  ...finish,
]

// Schon Lektionen vorhanden: kurzer Rundgang ohne Aufgaben.
export const SHORT_TOUR: TourStep[] = [
  { ...welcome, text: 'Ich zeige dir kurz die wichtigsten Stellen in VocSnap.' },
  ...homeSteps,
  {
    id: 'home-lessons',
    path: HOME,
    target: 'lessons',
    text: 'Deine Lektionen. Tippe eine an, um Wörter hinzuzufügen oder sie gezielt zu lernen. Neue Lektionen legst du mit „Neue Lektion“ an.',
    advance: 'button',
  },
  ...finish,
]

export function tourSteps(flow: TourProgress['flow']): TourStep[] {
  return flow === 'full' ? FULL_TOUR : SHORT_TOUR
}

export function startTour(hasLessons: boolean): TourProgress {
  return { flow: hasLessons ? 'short' : 'full', step: 0 }
}

// Wechsel auf die Seite des nächsten Schritts: dann geht es weiter, auch ohne Tipp auf das Ziel.
export function advancedByRoute(step: TourStep, next: TourStep | undefined, path: string): boolean {
  return !!next && !step.path.test(path) && next.path.test(path) && next.path !== ANY
}
