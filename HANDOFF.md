# Übergabe

Diese Datei hält den Stand fest, damit die Arbeit an anderer Stelle (zum Beispiel lokal) ohne Neu-Einlesen weitergeht. Nach jeder Etappe aktualisieren.

Lesereihenfolge für einen Neueinstieg: `CLAUDE.md`, `SPEC.md`, diese Datei.

## Stand

| Etappe | Status | Notizen |
|---|---|---|
| E0 Fundament | fertig | Gerüst, Datenmodell, Store, Anbieter-Schnittstelle, Einstellungen, Dark Mode, Pages-Workflow |
| E1 Nutzbarer Kern | fertig | Profile, Lektionen, Eingabe, Text-Import, Karteikarten (Umdrehen/Swipe), Fehler wiederholen, Start-Hinweis, Export/Import |
| E2 Scan | fertig | Foto-Scan mit Tesseract (lokal) und Gemini (Key), Prüftabelle, Beispielsatz und Warnhinweis über Gemini, Foto wird verworfen |
| E2b Anbieter-Kette | fertig | Gemini → Groq → Tesseract mit automatischem Wechsel, Groq als zweiter Anbieter, mehrere Seiten pro Scan |
| E3 Lernmodi | fertig | Leitner (5 Fächer, fällige Karten), Multiple Choice, Tippen, Hören und Schreiben, Fehlertoleranz |
| E4 Klassenarbeit und Matching | fertig | Lernplan zum Datum der Arbeit (Tagesplan, Generalprobe), Matching-Spiel |
| R1 Redesign Stil A3 | fertig | Farbschema, Schriften, Snappy, Startseite, Logo 4a, Start-Animation |
| R2 Seiten und Extras | fertig | Lernen, Erfolge, Mehr, Lektion neu; Snappy-Tipps, Einführung, Töne, leere Zustände |
| R3 Belohnungen und Anleitung | fertig | Neue Level-Kurve mit Rängen, Abzeichen in Stufen, Streak-Schutz |
| R4 Geführte Einführung | fertig | Führung durch die echte App (Spotlight, Snappy-Sprechblase), Beispielwörter, Startton ohne Knopf |
| R5 Aussprache und Fehlerbehebung | fertig | Lernmodus Aussprache (einschaltbar), 12 Fehler und Verbesserungen aus der Durchsicht |
| R6 Testplaner und KI-Wortlisten | fertig | Vokabeltests und Klassenarbeiten (Schema 2), KI-Wortlisten zu Situation oder Text, strengere Aussprache |
| R7 Umgestaltung | fertig | Danach R7b: Lernen mit bunten Modus-Kacheln, Erfolge mit Reitern (Abzeichen/Statistik/Bestenliste), Mehr mit Profil-Kopf und 3D-Symbolen. Unterseiten ohne Logo-Kopfzeile, Prüfungsseite mit Countdown-Karte, Lektion mit Leiste neu/wackelig/sicher; Fortschritt und Farbpunkte nur in der gelernten Richtung (`src/learn/progress.ts`). |
| R7a | fertig | Startseite ohne Scrollen, Snappys Tagesaufgabe, 3D-Symbole, Abzeichen mit Vitrine, Lektion, Neu-Menü, Einstellungen, Einführung angepasst |
| E5 Motivation und Feinschliff | fertig | XP, Level, Streak, Tagesziel, Abzeichen, Bestenliste, Konfetti, Avatare, App-Icons, Offline (PWA), Navigation mit Icons |

Status: offen / in Arbeit / fertig.

## Guthaben

| Nach Etappe | Verbraucht | Rest |
|---|---|---|
| E0 | bitte nachtragen | bitte nachtragen |
| E1 | bitte nachtragen | bitte nachtragen |
| E2 | bitte nachtragen | bitte nachtragen |
| E3 | bitte nachtragen | bitte nachtragen |
| E2b | bitte nachtragen | bitte nachtragen |
| E4 | ca. 26 % (ca. 26 $, gesamt seit E0) | ca. 74 % (ca. 73 $) |
| E5 | bitte nachtragen | bitte nachtragen |
| R1–R5 | ca. 79 % (ca. 78 $, gesamt seit E0) | ca. 21 $ |
| R6 + Entwürfe R7 | ca. 97 % (Rest ca. 3 $, Stand 2026-10-26) | ca. 3 $ |

Der Verbrauch ist in der Sitzung nicht sichtbar und muss in der Abrechnung nachgesehen werden.

Startguthaben: 99 $. Ab ca. 95 % Verbrauch nur noch Fehlerbehebung und Feinschliff (am 2026-10-26 vom Nutzer von 70 % auf 95 % angehoben).

## Nächste Schritte

Stand 2026-10-26: R7 auf ausdrücklichen Wunsch des Nutzers trotz Guthaben-Grenze umgesetzt (Pull Request offen). Guthaben danach praktisch aufgebraucht. Nächste Sitzung: Rückmeldung zu R7 einholen, nur noch Fehler beheben. Noch nicht gemacht aus der Liste unten: Fortschrittsleiste neu/wackelig/sicher in der Lektion, Seiten Lernen/Erfolge nur teilweise angeglichen.

**R7 Umgestaltung, vom Nutzer so entschieden (umgesetzt, Details siehe unten)** (Entwürfe und Bild in `docs/entwurf-r7/`):
1. Startseite wie `home-g`: muss ohne Scrollen auf einen Handy-Bildschirm passen und die volle Höhe nutzen (kein leerer grauer Streifen unten, z. B. Lektionskarten bzw. Kacheln mitwachsen lassen). Reihenfolge: Begrüßung mit Snappy, „Heute dran“ mit Tagesziel-Ring und Weiterlernen, Karte mit Serie (Flamme, Wochentage, Level) plus „Snappys Aufgabe“, vier bunte Kacheln (Vokabeltest, Klassenarbeit, Fehler, Level/Rang; ohne Termin „Test planen“, ohne Fehler „Frei üben“), Lektionen als farbige Wischkarten mit „+ Neu“.
2. Snappys Aufgabe (neu): täglich wechselnde kleine Aufgabe aus dem Lernverlauf berechnet (z. B. 5 richtig am Stück, 2 Runden, anderer Lernmodus, 3 Fehler ausbügeln), +20 XP bei Erfolg, keine Datenbankänderung.
3. „+ Neu“-Menü: Foto scannen, Mit KI, Leere Lektion, Test planen.
4. Bunte 3D-Symbole (Microsoft Fluent Emoji, MIT) statt Strich-Icons: untere Leiste, Startseite, Lektion, Neu-Menü, Abzeichen. Lokal ausliefern, verkleinert (webp).
5. Abzeichen wie `badges-b`: Vitrine mit Medaillen-Zählung, „Fast geschafft“, Filter, ovaler Rahmen in Stufenfarbe, Stufen-Schild, gestrichelt wenn offen, Schloss für geheime.
6. Lektion wie `lektion2`: Fortschrittsleiste neu/wackelig/sicher, vier Kacheln Foto/KI/Liste/Tippen, Farbpunkte statt roter ✕ (Antippen = bearbeiten/löschen).
7. Einstellungen Lernen: Tagesziel mit −/+ und Schnellwahl, „Für Profis“ eingeklappt (`einst.body`). Lernen und Erfolge nur angleichen.
8. Danach Einführung (`src/ui/tour/steps.ts`) an das neue Layout anpassen.

Außerdem offen: Rückmeldung zu Aussprache und KI-Wortlisten, vom Nutzer gefundene Fehler erfragen.

Arbeitsweise mit dem Nutzer: erst Plan oder Screenshots zeigen, dann bauen; Pull Request nur auf Wunsch, er merged selbst, danach Pull Request beobachten. Antworten auf Deutsch, einfach erklärt.

Arbeitsweise bisher: Arbeit auf einem Branch, Pull Request nach `main`, nach dem Merge veröffentlicht GitHub Actions automatisch.

Deployment: Jeder Push auf `main` baut und veröffentlicht die App über `.github/workflows/deploy.yml` (vorher Tests). Pages ist auf „GitHub Actions" eingestellt.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/data/types.ts` | Datensätze (Profile, Lesson, Word, ReviewEvent) mit Sync-Pflichtfeldern |
| `src/data/store.ts` | `Store`-Schnittstelle, einziger Datenzugang der UI |
| `src/data/dexieStore.ts` | Umsetzung mit Dexie, Löschen per `deleted_at` |
| `src/data/db.ts` | Dexie-Schema, `MIGRATIONS`-Liste, `SCHEMA_VERSION` = Anzahl Einträge |
| `src/data/device.ts` | Geräte-ID (localStorage) |
| `src/config/providers.ts` | Anbieter, Modellnamen, Key-Bedarf |
| `src/providers/` | Scan-Schnittstelle (`OcrProvider`, `ScanResult`, `ScanError`), Auswahl mit Rückfall auf Tesseract |
| `src/providers/tesseract.ts`, `layout.ts` | Tesseract im Browser, Wörter nach Position zu Zeilen und Spalten |
| `src/providers/gemini.ts` | Gemini per REST, Antwort als JSON-Schema |
| `src/providers/groq.ts` | Groq per REST (OpenAI-Format), Bild als data-URL, JSON-Modus |
| `src/providers/shared.ts` | Gemeinsamer Auftrag, JSON-Auswertung, HTTP-Fehler → `ScanError`, Wiederholungen (`withRetries`) |
| `src/providers/chain.ts` | Anbieter-Kette: Reihenfolge, Überspringen ohne Key, Wechsel bei Fehler, Mindestabstand zwischen Anfragen |
| `src/ui/ProviderSection.tsx` | Einstellungen: Reihenfolge, Keys, Hinweis bei abgelehntem Key |
| `scripts/copy-tesseract.mjs` | Kopiert Worker, Kern und Sprachdaten nach `public/tesseract` (vor `dev` und `build`, nicht im Repo) |
| `src/ui/ReviewList.tsx` | Prüftabelle für Scan und Text-Import |
| `src/settings/settings.ts` | Geräte-Einstellungen inkl. Keys, Prüfung beim Laden, localStorage |
| `src/data/exchange.ts` | Export-Format, Prüfung/Migration (`parseExchange`), Zusammenführen (`mergeRecords`, `mergeEvents`) |
| `src/config/languages.ts` | Sprachen der Lektionen |
| `src/import/parsePairs.ts` | Text aus der Zwischenablage in Vokabelpaare zerlegen |
| `src/learn/session.ts` | Lernrunde: Abfragen bauen, Antworten, Fehler sammeln |
| `src/learn/stats.ts` | Aus Ereignissen: heute gelernt, offene Fehler |
| `src/learn/leitner.ts` | Fach und Fälligkeit je Karte (Wort + Richtung), komplett aus Ereignissen berechnet |
| `src/learn/tolerance.ts` | Bewertung getippter Antworten (richtig / halb / falsch) |
| `src/learn/choices.ts` | Antwortauswahl für Multiple Choice |
| `src/learn/examPlan.ts` | Lernplan zur Klassenarbeit aus dem Leitner-Stand |
| `src/learn/matching.ts`, `src/modes/matching/` | Matching-Spiel (5 Paare pro Runde) |
| `src/learn/dates.ts` | Lokale Tage, Datumsanzeige |
| `src/ui/exam.ts`, `src/ui/pages/ExamPages.tsx` | Klassenarbeit laden, planen, anzeigen |
| `src/learn/motivation.ts` | XP, Level, Streak, Tagesziel, Abzeichen (alles aus Ereignissen) |
| `src/ui/stats.ts`, `StatsBar.tsx`, `pages/AchievementsPage.tsx` | Statusleiste, Erfolge-Seite mit Bestenliste |
| `src/ui/Confetti.tsx` | Konfetti (eigenes Canvas, ohne Bibliothek) |
| `public/icons/` | Platzhalter-App-Icons (selbst erzeugt) |
| `.claude/skills/ui-ux-pro-max/` | Design-Skill (MIT, Quelle in `QUELLE.md`), lokal nutzbar mit `python3 scripts/search.py` |
| `src/index.css` | Design-Grundlage: Farben (Tailwind-Theme), Schriften, Schatten, Animationen |
| `src/ui/ui.ts`, `icons.tsx`, `Mascot.tsx`, `Logo.tsx`, `Splash.tsx`, `haptics.ts`, `sounds.ts`, `Onboarding.tsx` | Gemeinsame Klassen, Linien-Icons, Maskottchen „Snappy", Vibration |
| `vite.config.ts` | PWA: Manifest, Service Worker (vite-plugin-pwa) |
| `src/modes/choice/`, `typing/`, `listen/`, `shared/` | Lernmodi und gemeinsame Teile (Eingabe, Rückmeldung, Sprachausgabe in `speech.ts`) |
| `src/modes/modes.ts` | Kennungen und Standard-Reihenfolge der Lernmodi |
| `src/modes/types.ts`, `registry.ts` | Schnittstelle `LearningMode` und Liste der fertigen Modi |
| `src/modes/flashcard/` | Karteikarte (Umdrehen oder Swipe, Tastatur: Leertaste, Pfeile) |
| `src/ui/` | Hash-Routing und Seiten. Zugriff auf Daten nur über `useApp().store` |

Befehle: `npm run dev`, `npm test`, `npm run build`. Basis-Pfad ist relativ (`./`), mit `BASE_PATH` überschreibbar.

## Entscheidungen

- Hosting zuerst GitHub Pages (öffentliches Repo), später eventuell eigener Webspace.
- Texterkennung als Kette (E2b): Standard-Reihenfolge Gemini → Groq → Tesseract, in den Einstellungen änderbar. Anbieter ohne Key werden übersprungen, Tesseract braucht keinen.
- Datenmodell ist von Anfang an sync-fähig, der Sync selbst kommt später.
- Karteikarten: Bestätigung per Umdrehen oder per Swipe, einstellbar.
- Fehlertoleranz: ein Buchstabe daneben oder falsche Groß-/Kleinschreibung zählt als halber Fehler.
- Einstellungen und Keys liegen in localStorage (gerätebezogen), synchronisierbare Daten in IndexedDB.
- Design: Dunkel (Standard) oder Hell, kein „System".
- ReviewEvent hat dieselben Sync-Pflichtfelder, wird aber nie geändert.
- Richtung im Datenmodell: `to_target` / `to_source`, Ergebnis: `correct` / `half` / `wrong`. `to_target` heißt: Begriff (Fremdsprache) wird gezeigt, Übersetzung gefragt.
- Aktives Profil steht in den Geräte-Einstellungen (`activeProfileId`).
- Lernmodi bekommen einen Stapel (`batchSize`) und melden Ergebnisse gesammelt, damit Matching (E4) dieselbe Schnittstelle nutzen kann.
- Löschen von Profil oder Lektion markiert abhängige Lektionen und Wörter mit. Ereignisse bleiben.
- Import führt zusammen (neuestes `updated_at` gewinnt, Ereignisse werden vereinigt), nichts wird gelöscht.
- „Fehler wiederholen" auf der Startseite: Wörter, deren letzte Abfrage falsch war. Bis Leitner (E3) gibt es keine Fälligkeit, gelernt werden alle Wörter der gewählten Lektionen.
- Karteikarte kennt nur gewusst/nicht gewusst, kein halber Fehler. Multiple Choice ebenso.
- Leitner: Karte = Wort + Richtung. Neue Karten sind Fach 1 und sofort fällig. Fällig, wenn seit der letzten Abfrage (lokaler Kalendertag) mindestens der Abstand des Fachs vergangen ist. Jede Abfrage zählt, auch freies Üben und Fehlerrunden.
- „Nur fällige Wörter" ist Standard beim normalen Lernen. Bei „Fehler wiederholen" und „Diese Lektion lernen" wird alles abgefragt.
- Hören und Schreiben: Das gefragte Wort wird vorgelesen statt angezeigt (Richtung wie bei den anderen Modi). Ohne Sprachausgabe wird das Wort angezeigt.
- Klassenarbeit: keine eigene Tabelle, sondern das vorhandene Feld `exam_date` der Lektionen. Eine Arbeit = alle Lektionen eines Profils mit gleichem Datum. Kein Schema-Wechsel nötig.
- Lernplan (`planExam`): Karte = Wort + Richtung, beide Richtungen. Neue Karten werden gleichmäßig auf die Tage vor dem letzten Tag verteilt. Die Tagesquote richtet sich nach dem Stand zu Tagesbeginn, damit sie sich beim Lernen nicht verschiebt. Dazu kommen die nach Leitner fälligen Karten. Am letzten Tag vor der Arbeit Generalprobe mit allen Karten, am Tag der Arbeit nur die unsicheren (Fach 1–2). „Sicher" heißt ab Fach 3.
- „Jetzt lernen" im Plan fragt zuerst die heute noch offenen Karten ab, danach zum Nachüben alle geplanten.
- Matching: 5 Paare pro Runde, erst links wählen, dann rechts. Ein Fehlversuch macht die Abfrage falsch, sonst richtig. Gleicher Lösungstext zählt als Treffer. Bei „Beide Richtungen" kann dasselbe Wort in beiden Richtungen in einer Runde vorkommen.
- XP: richtig 10, halb 5, falsch 1. Bonus: +50 je Tag mit erreichtem Tagesziel, +20 je fehlerfreier Runde (mindestens 10 Abfragen, keine falsch). Runden werden nicht gespeichert, sondern aus den Ereignissen geschätzt: gleicher Modus, höchstens 5 Minuten Pause. Der Tagesziel-Bonus richtet sich nach dem aktuellen Tagesziel; wer es erhöht, kann rückwirkend XP verlieren.
- Level: Schritt von n nach n+1 kostet 30 · n^1,8 XP (auf 10 gerundet). Level 2 ab 30, 3 ab 130, 5 ab 710, 10 ab 5840, 20 ab 43 840. Ränge: Neuling (1), Entdecker (5), Wortsammler (10), Sprachprofi (15), Meister (20), Legende (30).
- Streak: Tage in Folge mit mindestens einer Abfrage. Zählt bis gestern weiter, solange heute noch gelernt werden kann. Streak-Schutz: höchstens 2 verpasste Tage in jedem 30-Tage-Fenster werden automatisch überbrückt (zählen nicht mit). Eine Lücke wird nur überbrückt, wenn alle ihre Tage hineinpassen, sonst reißt die Serie, ohne Schutztage zu verbrauchen. Schutztage erscheinen blau in Wochenleiste und Lern-Kalender.
- Tagesziel: verschiedene Wörter pro Tag, die richtig oder halb richtig beantwortet wurden (Einstellung „gewusste Vokabeln pro Tag"). Falsche Antworten zählen nicht, halten aber die Streak.
- Zahlenfelder in den Einstellungen (`NumberField`) lassen sich beim Tippen leeren, ungültige Werte springen beim Verlassen zurück.
- Abzeichen werden nur aus Kennzahlen berechnet, nicht gespeichert (passt zum Prinzip „Lernstand aus Ereignissen"). Stufen Bronze/Silber/Gold/Diamant: Abfragen 100/500/2000/10 000, Tage in Folge 3/7/30/100, Tagesziel 1/10/50/150, Level 5/10/20/30, Karten in Fach 5 1/50/250/1000, Wörter angelegt 20/100/500/2000, fehlerfreie Runden 1/10/50/200; einstufig: alle 5 Lernmodi. Geheim (erst nach Erreichen sichtbar): vor 7 Uhr, nach 22 Uhr, Comeback nach über 7 Tagen Pause, Arbeit gut vorbereitet (jedes Wort vor dem Tag der Arbeit geübt).
- Bestenliste: alle Profile des Geräts, wahlweise XP der letzten 7 Tage oder gesamt. Erscheint ab zwei Profilen.
- Belohnung am Rundenende: XP der Runde, Level-Aufstieg, „Tagesziel geschafft". Konfetti bei Level-Aufstieg, erreichtem Tagesziel oder fehlerfreier Runde. Entfällt bei „Bewegung reduzieren".
- Avatare: Emoji als Platzhalter (Feld `avatar` im Profil).
- PWA: App-Hülle wird vorab gespeichert (ca. 0,5 MB), Lernen geht damit offline. Tesseract-Dateien (ca. 17 MB) werden erst beim ersten Scan zwischengespeichert. Updates werden automatisch geladen (`autoUpdate`).
- Design „A3": Indigo (#4F46E5) mit Orange als Aktionsfarbe, Hintergrund #F5F3FF, weiche Karten mit Schatten statt Rahmen, Überschriften Fredoka, Text Nunito (beide OFL, mitgeliefert, offline). Die Tailwind-Grautöne (`slate-*`) sind im Theme auf leicht indigofarbene Töne umgestellt, so passen alle Seiten ohne Einzeländerung. Hell ist jetzt Standard, Dunkel bleibt wählbar.
- Maskottchen „Snappy" (Karteikarte mit Gesicht, selbst gezeichnet): fröhlich, jubelnd (alles erledigt, fehlerfreie Runde) oder müde (Serie abgerissen).
- Logo 4a (`src/ui/Logo.tsx`): weißes Kärtchen mit „V" (als Form gezeichnet, nicht als Schrift) im orangen Auslöser-Ring, gelber Funke, Indigo-Verlauf. Daraus sind Favicon und App-Icons in `public/icons/` erzeugt (normal, maskable, Apple).
- Start-Animation (`src/ui/Splash.tsx`): einmal pro App-Start, ca. 2,3 s, Tipp überspringt. Das Logo setzt sich zusammen (Kärtchen wirbelt herein, Ring dreht sich ein, Blitz beim Einrasten, Funke leuchtet), dann erscheint der Schriftzug Buchstabe für Buchstabe. Bei „Bewegung reduzieren" nur 0,6 s ohne Bewegung.
- Animationen nur per CSS (Einblenden, Wippen, Blinzeln, Drücken, Schütteln bei falsch). Bei „Bewegung reduzieren" ist alles aus.
- Vibration über `navigator.vibrate` (Android), abschaltbar in den Einstellungen. iPhones unterstützen das im Browser nicht.
- „Weiterlernen" startet sofort mit dem zuletzt gewählten Modus und der Richtung und allen fälligen Karten. Ist nichts fällig, öffnet sich die normale Auswahl. „Heute dran" zählt die fälligen Wörter in genau dieser Richtung.
- Startseite: Begrüßung, Hauptkarte mit Snappy und Tagesziel, Kacheln Serie/Level/XP, Wochenleiste Mo–So, Klassenarbeiten, Schnellzugriff Foto/Lektion, Lektionen mit Sprachfarbe und „% sicher" (Karten ab Fach 3).
- „Mehr" ist eine Liste mit Unterseiten (`/einstellungen/:group`): Profil, Lernen, Foto-Scan, Darstellung, Daten, Über VocSnap.
- Lernen: Schnellstart-Karte, Lernmodi als Kacheln (ein Tipp startet), Lektionen/Richtung/„nur fällige" unter „Anpassen". In der Runde: Zähler „x in Folge" (halb zählt mit), kleiner Snappy, Karten gleiten herein. Rundenende mit 1–3 Sternen (ab 60 % bzw. 90 %, halb zählt halb), hochzählenden XP, Level- und Tagesziel-Hinweis.
- Erfolge: Level-Ring, Kennzahlen, Lern-Kalender (12 Wochen, Abfragen pro Tag), Abzeichen mit Fortschritt, Bestenliste als Podest.
- Lektion: farbiger Kopf in Sprachfarbe, Reiter „Wörter"/„Hinzufügen", Suche, Punkte je Wort = Fach (schwächere Richtung).
- Snappy-Tipps (`src/learn/tips.ts`): Sprechblase auf der Startseite je nach Tagesziel, Serie, gestern und Uhrzeit.
- Geführte Einführung (`src/ui/tour/`): dunkelt die Seite ab, lässt nur das markierte Element (`data-tour`) bedienbar und erklärt es in einer Snappy-Sprechblase. Schritte sind Daten in `steps.ts` (Seite, Ziel, Text, wie es weitergeht: Knopf, Tipp aufs Ziel, Seitenwechsel oder Erscheinen des nächsten Ziels). Bei Formularen und in der Lernrunde bleibt die Seite frei bedienbar.
- Neu ohne Lektionen: Lektion anlegen, Wörter hinzufügen (oder Beispielwörter), Lektion lernen, Runde, Ergebnis, Startseite, Navigation. Mit vorhandenen Lektionen: kurzer Rundgang über die Startseite. Start nach dem ersten Profil, neu über „Mehr → Anleitung" oder „Über VocSnap". Stand liegt in den Einstellungen (`tour`), abseits der Schritte erscheint „Anleitung pausiert · Beenden".
- Lernmodus Aussprache (`src/modes/speak/`): zeigt das deutsche Wort, die Fremdsprache wird ins Mikrofon gesprochen (Web Speech API, braucht Internet). Bewertung in `src/learn/pronunciation.ts`: ohne Groß-/Kleinschreibung, Satzzeichen und Artikel; knapp daneben = halb. Bis zu 3 Versuche, „Vorsprechen“ begrenzt auf halb. Bei Fehlern (kein Mikrofon, kein Internet, Browser ohne Erkennung) Selbstbewertung. Standardmäßig aus und unsichtbar, einschalten unter Mehr → Lernen (`settings.pronunciation`).
- Prüfungen (Schema 2, `exams`): Vokabeltest oder Klassenarbeit mit Datum, Lektionen und optional ausgewählten Wörtern (`word_ids`). Migration übernimmt alte `lesson.exam_date` als Klassenarbeiten (feste IDs `ka-<profil>-<datum>`, auch beim Import alter Exportdateien über `UPGRADES[1]`). `exam_date` an Lektionen ist veraltet und wird nicht mehr geschrieben. Startseite: Abschnitt „Prüfungen“ mit Reitern Vokabeltests/Klassenarbeiten. Vokabeltest-Plan: Generalprobe am Vortag nur mit neuen und unsicheren Karten (Fach 1–2). Adressen `/pruefung/neu?art=…`, `/pruefung/:id`, `/pruefung/:id/bearbeiten`, Lernen mit `?pruefung=<id>`.
- KI-Wortlisten (`/lektion/:id/ki`): Situation beschreiben oder fremdsprachigen Text einfügen bzw. .txt öffnen, Anzahl 10/20/30, Niveau Anfänger/Mittel/Fortgeschritten. Läuft über die Anbieter-Kette (`runGenerate`, nur Anbieter mit `generates`), Auftrag in `buildGeneratePrompt` (Text als Material markiert, max. 6000 Zeichen). Ergebnis in die Prüfliste wie beim Scan. Nur Groq und Gemini (Entscheidung des Nutzers, kein Claude).
- Aussprache strenger: richtig nur, wenn die wahrscheinlichste Erkennung passt und die Sicherheit ≥ 0,7 ist (`CLEAR`), sonst halb mit neuem Versuch. Deutlichkeit wird angezeigt, „Langsam“ spricht mit Rate 0,6. Betonung kann die Browser-Erkennung grundsätzlich nicht bewerten.
- Robustheit: Wörter aus Scan, Text und Beispielen in einer Transaktion (`Store.createWords`). Fehlerbildschirm (`ErrorBoundary`) statt weißer Seite. Speicherfehler in Formularen sichtbar. Nach einer Runde lädt die Lernseite den Stand neu. Zurück nach dem Scan fragt nach.
- Datensicherheit: `navigator.storage.persist()` nach dem ersten Profil. Letzter Export in `settings.lastBackup`; ab 20 Wörtern erinnert die Startseite, wenn nie oder vor 14 Tagen gesichert wurde (`src/data/backup.ts`).
- PWA: `registerType: 'prompt'`, `UpdateWatcher` lädt neue Versionen nur auf Start- oder Erfolge-Seite. Tesseract-Cache heißt nach den Paketversionen, ältere Caches werden beim Start gelöscht.
- Kontrast: `slate-400/500` im hellen Modus dunkler, im dunklen Modus heller (`src/index.css`).
- R7: 3D-Symbole als `public/emoji/*.webp` (Fluent Emoji, MIT, Lizenz daneben), Komponente `Emoji`. Startseite füllt die Bildschirmhöhe (`min-h-[calc(100dvh-7.5rem)]`, Kacheln wachsen mit). Snappys Tagesaufgabe in `src/learn/quests.ts` (täglich wechselnd nach dayNumber, +20 XP, aus Ereignissen berechnet). Neu-Menü `src/ui/NewSheet.tsx` (`/lektion/neu?weiter=ki` springt nach dem Anlegen zur KI-Seite). Wörter löschen nur noch im Bearbeiten-Modus.
- Beispielwörter (`src/data/examples.ts`): erfundene Grundwörter Englisch/Französisch ↔ Deutsch, Knopf nur in leeren Lektionen.
- Töne per Web Audio (keine Dateien): Start-Melodie mit Auslöser-Klick, Töne bei richtig/halb/falsch und Erfolg. Abschaltbar unter Darstellung. Browser spielen Ton oft erst nach einer Berührung (z. B. Samsung). Ist der Ton gesperrt, bleibt der Start still (Wunsch des Nutzers, kein Knopf). Der gesperrte Audio-Kontext wird verworfen, damit die Melodie nicht später unpassend erklingt.
- Fehlertoleranz (offene Punkte aus der SPEC vorläufig so entschieden, änderbar in `tolerance.ts`):
  - Ein Buchstabe daneben ist halb, erst ab drei Buchstaben im Lösungswort.
  - Ein fehlender oder falscher Akzent zählt als ein Buchstabe, also halb. Zwei Akzentfehler sind falsch.
  - Mehrere Antworten mit `,` `;` `/` getrennt: Jede zählt als richtig.
  - Teile in Klammern sind optional.
  - Fehlender Artikel (der/die/das, the/a, le/la/l'/les …) ist halb.
- Tesseract läuft komplett aus der eigenen App (kein CDN), Sprachdaten `best_int` für Englisch, Französisch, Deutsch (ca. 5 MB, werden erst beim ersten Scan geladen). Neue Sprache: `@tesseract.js-data/<code>` installieren und in `TESSERACT_LANGS` eintragen.
- Gemini: Aliase `gemini-flash-latest`, Wiederholungen mit dem sparsameren `gemini-flash-lite-latest` (eigenes Kontingent). Bis zu zwei Wiederholungen bei Überlastung (5xx) oder Limit (429), Wartezeit 2 s, dann 5 s.
- Groq: Modell `qwen/qwen3.8-27b` (Llama 4 Scout wurde im Juli 2026 abgeschaltet). Am 2026-10-17 mit echtem Key getestet: Aufruf aus dem Browser (CORS), Bild und JSON-Modus funktionieren, Ergebnisse besser als mit Gemini. Eine Wiederholung nach 3 s. Denk-Abschnitte (`<think>`) und Code-Zäune in der Antwort werden entfernt.
- Fehlerarten: Limit (429), überlastet (5xx), ungültiger Key (401/403, Gemini 400 mit Key-Hinweis), keine Verbindung (Netzwerk oder CORS), unlesbare Antwort, sonst fehlgeschlagen. Bei jedem Fehler wechselt die Kette zum nächsten Anbieter. Nur ein ungültiger Key wird gemerkt (`invalidKeys`) und in den Einstellungen deutlich angezeigt, bis der Key geändert wird.
- Mindestabstand je Anbieter (`minIntervalMs`): Gemini 6 s, Groq 2,5 s. Gilt zwischen mehreren Seiten und zwischen schnell aufeinanderfolgenden Scans.
- Mehrere Seiten pro Scan, Ergebnisse landen in einer Prüftabelle. Darüber steht klein, welcher Anbieter welche Seite erkannt hat.
- Limits (Stand 2026-10-17, nur aus Drittquellen, die Original-Doku war aus der Arbeitsumgebung nicht erreichbar):
  - Groq kostenlos: ca. 30 Anfragen/Minute, ca. 250 Anfragen/Tag für `qwen/qwen3.8-27b`. Limits gelten pro Organisation, nicht pro Key.
  - Gemini kostenlos: Google veröffentlicht keine festen Zahlen mehr. Gemessen wurden laut Drittquellen ca. 10–15 Anfragen/Minute; pro Tag für Flash nur ca. 20, für Flash-Lite ca. 500.
- Fotos werden auf 1600 px verkleinert, nur im Speicher gehalten und nach der Erkennung verworfen.
- Gemini-Bedingungen (geprüft 2026-10, Originalseite war aus der Arbeitsumgebung nicht erreichbar): Nutzung ab 18, in EU/CH/UK sehen die Bedingungen für Apps bezahlte Dienste vor, dafür keine Nutzung der Daten zum Training. Entscheidung: wie geplant optional, Hinweis in den Einstellungen, Key erstellt ein Erwachsener.

## Offene Punkte

- Fehlertoleranz: vorläufige Entscheidungen (siehe oben) im Alltag prüfen.
- Matching: prüfen, ob dasselbe Wort in beiden Richtungen in einer Runde stört (dann pro Runde nur eine Richtung je Wort).
- Offline-Scan mit Tesseract nach dem ersten Laden auf echten Geräten prüfen (Worker lädt den Kern per `importScripts`, ob der Service Worker das abfängt, hängt vom Browser ab).
- Reihenfolge der Lernmodi im Menü (vorläufig: Karteikarte, Multiple Choice, Tippen, Hören und Schreiben, Matching).
- Gemini-Bedingungen bei Gelegenheit direkt auf ai.google.dev gegenlesen.
- Groq-Nutzungsbedingungen (Alter, Datennutzung) prüfen.
- Überlegen, ob Groq in der Standard-Reihenfolge vor Gemini stehen soll (in den Einstellungen schon jetzt änderbar).
- Scan-Qualität bei echten Buchseiten (Lautschrift-Spalte, drei Spalten) beobachten, ggf. `layout.ts` anpassen.
- Beim nächsten `schema_version`-Sprung: Upgrade-Schritt für alte Export-Dateien in `UPGRADES` (`src/data/exchange.ts`) ergänzen.
- Server und Anbieter für den späteren Sync.
- Aus der Durchsicht offen: Lernverlauf wird pro Seite mehrfach geladen und sortiert (bei vielen tausend Abfragen träge); Tesseract startet pro Seite einen neuen Worker; Warnung bei doppelten Wörtern; Tastenkürzel 1–4 im Multiple Choice; Export per Teilen-Dialog auf dem iPhone.

## Wunschliste (nicht in der laufenden Etappe bauen)

- Sync und Konten
- Wettkampf zwischen Profilen
- KI-Chat / Rollenspiel
- Objekt-Scanner
- Anzeige „Falsche Freunde" im Abfragemodus
- Bilder zu Vokabeln
- Bezahlversion
- Weitere Sprachen
- Tägliche Aufgaben (3 kleine Ziele pro Tag, Schatztruhe mit Bonus-XP)
- Snappy-Garderobe: Accessoires (Mütze, Brille, Krone …) je Level oder Rang freischalten
- Level-Aufstieg als eigener Feier-Bildschirm mit Rang und Accessoire
- Blitzrunde (60 Sekunden, Highscore) als Lernmodus
- Runde „Schwere Wörter“ (am häufigsten falsch)
- Wochenrückblick am Sonntag
- Echte Aussprache-Bewertung mit Betonung (z. B. Azure Pronunciation Assessment, kostenlose Stufe), Datenschutz für Kinderstimmen klären
- Echte Play-Store-App mit eigener Hülle (z. B. Capacitor), dann auch Startton ohne Berührung; braucht eigene Domain wegen assetlinks

## Installation auf Handys (Erfahrungen des Nutzers)

- Android/Chrome: ⋮ → „App installieren“. Startton kommt automatisch (installierte Chrome-App).
- Samsung: „Web-App installieren“ in Samsung Internet geht über Play; Play Protect blockierte, Lösung: Details → „Trotzdem installieren“. Samsung Internet lässt den Startton ohne Berührung nicht zu (vom Nutzer akzeptiert, kein Knopf).
- Xiaomi: in Chrome installieren; vorher Einstellungen → Apps → Chrome → Weitere Berechtigungen → „Verknüpfungen auf dem Startbildschirm erstellen“ erlauben. Speicherbereiniger kann Websitedaten löschen, deshalb Sicherungs-Erinnerung.
- Hinweise zu kommerzieller Nutzung wurden besprochen: GitHub Pages ist nicht für kommerzielle Angebote gedacht (auch nicht mit Pro), Repo hat keine LICENSE (= alle Rechte vorbehalten), Gemini verlangt für EU-Apps den Bezahl-Zugang und Mindestalter 18. Noch keine Entscheidung des Nutzers.

## Lokal weiterarbeiten

1. Repository klonen.
2. `npm install`, dann `npm run dev`.
3. Claude Code im Projektordner starten, `CLAUDE.md`, `SPEC.md` und diese Datei lesen lassen.
4. Mit der ersten offenen Etappe in der Tabelle oben weitermachen.
