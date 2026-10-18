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

Der Verbrauch ist in der Sitzung nicht sichtbar und muss in der Abrechnung nachgesehen werden.

Startguthaben: 99 $. Ab ca. 70 % Verbrauch nur noch Fehlerbehebung und Feinschliff.

## Nächste Schritte

Stand 2026-10-18: Alle Etappen E0 bis E5 (und E2b) sind fertig. Weiter geht es mit Feinschliff, Fehlerbehebung und der Wunschliste.

1. Verbrauchtes Guthaben nach E5 nachtragen.
2. App auf dem Handy installieren („Zum Startbildschirm hinzufügen") und offline testen. Sprachausgabe prüfen.
3. Offene Punkte unten abarbeiten, dann Ideen aus der Wunschliste mit dem Nutzer priorisieren.

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
- XP: richtig 10, halb 5, falsch 1. Level n ab 50 · (n−1)² XP (Level 2 ab 50, 3 ab 200, 4 ab 450 …).
- Streak: Tage in Folge mit mindestens einer Abfrage. Zählt bis gestern weiter, solange heute noch gelernt werden kann.
- Tagesziel: verschiedene Wörter pro Tag, die richtig oder halb richtig beantwortet wurden (Einstellung „gewusste Vokabeln pro Tag"). Falsche Antworten zählen nicht, halten aber die Streak.
- Zahlenfelder in den Einstellungen (`NumberField`) lassen sich beim Tippen leeren, ungültige Werte springen beim Verlassen zurück.
- Abzeichen werden nur aus Kennzahlen berechnet, nicht gespeichert (passt zum Prinzip „Lernstand aus Ereignissen").
- Bestenliste: alle Profile des Geräts, wahlweise XP der letzten 7 Tage oder gesamt. Erscheint ab zwei Profilen.
- Belohnung am Rundenende: XP der Runde, Level-Aufstieg, „Tagesziel geschafft". Konfetti bei Level-Aufstieg, erreichtem Tagesziel oder fehlerfreier Runde. Entfällt bei „Bewegung reduzieren".
- Avatare: Emoji als Platzhalter (Feld `avatar` im Profil).
- PWA: App-Hülle wird vorab gespeichert (ca. 0,5 MB), Lernen geht damit offline. Tesseract-Dateien (ca. 17 MB) werden erst beim ersten Scan zwischengespeichert. Updates werden automatisch geladen (`autoUpdate`).
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

## Wunschliste (nicht in der laufenden Etappe bauen)

- Sync und Konten
- Wettkampf zwischen Profilen
- KI-Chat / Rollenspiel
- Objekt-Scanner
- Anzeige „Falsche Freunde" im Abfragemodus
- Bilder zu Vokabeln
- Bezahlversion
- Weitere Sprachen

## Lokal weiterarbeiten

1. Repository klonen.
2. `npm install`, dann `npm run dev`.
3. Claude Code im Projektordner starten, `CLAUDE.md`, `SPEC.md` und diese Datei lesen lassen.
4. Mit der ersten offenen Etappe in der Tabelle oben weitermachen.
