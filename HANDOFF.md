# Übergabe

Diese Datei hält den Stand fest, damit die Arbeit an anderer Stelle (zum Beispiel lokal) ohne Neu-Einlesen weitergeht. Nach jeder Etappe aktualisieren.

Lesereihenfolge für einen Neueinstieg: `CLAUDE.md`, `SPEC.md`, diese Datei.

## Stand

| Etappe | Status | Notizen |
|---|---|---|
| E0 Fundament | fertig | Gerüst, Datenmodell, Store, Anbieter-Schnittstelle, Einstellungen, Dark Mode, Pages-Workflow |
| E1 Nutzbarer Kern | fertig | Profile, Lektionen, Eingabe, Text-Import, Karteikarten (Umdrehen/Swipe), Fehler wiederholen, Start-Hinweis, Export/Import |
| E2 Scan | fertig | Foto-Scan mit Tesseract (lokal) und Gemini (Key), Prüftabelle, Beispielsatz und Warnhinweis über Gemini, Foto wird verworfen |
| E3 Lernmodi | offen | |
| E4 Klassenarbeit und Matching | offen | |
| E5 Motivation und Feinschliff | offen | |

Status: offen / in Arbeit / fertig.

## Guthaben

| Nach Etappe | Verbraucht | Rest |
|---|---|---|
| E0 | bitte nachtragen | bitte nachtragen |
| E1 | bitte nachtragen | bitte nachtragen |
| E2 | bitte nachtragen | bitte nachtragen |

Der Verbrauch ist in der Sitzung nicht sichtbar und muss in der Abrechnung nachgesehen werden.

Startguthaben: 99 $. Ab ca. 70 % Verbrauch nur noch Fehlerbehebung und Feinschliff.

## Nächste Schritte

1. Gemini einmal mit echtem Key testen (hier ohne Key nur bis zur Key-Prüfung von Google getestet).
2. E3 beginnen (siehe `SPEC.md`, Abschnitt 6).

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
| `src/providers/gemini.ts` | Gemini per REST, Antwort als JSON-Schema, Fehler → `ScanError` |
| `scripts/copy-tesseract.mjs` | Kopiert Worker, Kern und Sprachdaten nach `public/tesseract` (vor `dev` und `build`, nicht im Repo) |
| `src/ui/ReviewList.tsx` | Prüftabelle für Scan und Text-Import |
| `src/settings/settings.ts` | Geräte-Einstellungen inkl. Keys, Prüfung beim Laden, localStorage |
| `src/data/exchange.ts` | Export-Format, Prüfung/Migration (`parseExchange`), Zusammenführen (`mergeRecords`, `mergeEvents`) |
| `src/config/languages.ts` | Sprachen der Lektionen |
| `src/import/parsePairs.ts` | Text aus der Zwischenablage in Vokabelpaare zerlegen |
| `src/learn/session.ts` | Lernrunde: Abfragen bauen, Antworten, Fehler sammeln |
| `src/learn/stats.ts` | Aus Ereignissen: heute gelernt, offene Fehler |
| `src/modes/modes.ts` | Kennungen und Standard-Reihenfolge der Lernmodi |
| `src/modes/types.ts`, `registry.ts` | Schnittstelle `LearningMode` und Liste der fertigen Modi |
| `src/modes/flashcard/` | Karteikarte (Umdrehen oder Swipe, Tastatur: Leertaste, Pfeile) |
| `src/ui/` | Hash-Routing und Seiten. Zugriff auf Daten nur über `useApp().store` |

Befehle: `npm run dev`, `npm test`, `npm run build`. Basis-Pfad ist relativ (`./`), mit `BASE_PATH` überschreibbar.

## Entscheidungen

- Hosting zuerst GitHub Pages (öffentliches Repo), später eventuell eigener Webspace.
- Standard-Texterkennung: Tesseract. Optional Gemini mit kostenlosem Key. Weitere Anbieter über dieselbe Schnittstelle.
- Datenmodell ist von Anfang an sync-fähig, der Sync selbst kommt später.
- Karteikarten: Bestätigung per Umdrehen oder per Swipe, einstellbar.
- Fehlertoleranz: ein Buchstabe daneben oder falsche Groß-/Kleinschreibung zählt als halber Fehler. Details noch offen.
- Einstellungen und Keys liegen in localStorage (gerätebezogen), synchronisierbare Daten in IndexedDB.
- Design: Dunkel (Standard) oder Hell, kein „System".
- ReviewEvent hat dieselben Sync-Pflichtfelder, wird aber nie geändert.
- Richtung im Datenmodell: `to_target` / `to_source`, Ergebnis: `correct` / `half` / `wrong`. `to_target` heißt: Begriff (Fremdsprache) wird gezeigt, Übersetzung gefragt.
- Aktives Profil steht in den Geräte-Einstellungen (`activeProfileId`).
- Lernmodi bekommen einen Stapel (`batchSize`) und melden Ergebnisse gesammelt, damit Matching (E4) dieselbe Schnittstelle nutzen kann.
- Löschen von Profil oder Lektion markiert abhängige Lektionen und Wörter mit. Ereignisse bleiben.
- Import führt zusammen (neuestes `updated_at` gewinnt, Ereignisse werden vereinigt), nichts wird gelöscht.
- „Fehler wiederholen" auf der Startseite: Wörter, deren letzte Abfrage falsch war. Bis Leitner (E3) gibt es keine Fälligkeit, gelernt werden alle Wörter der gewählten Lektionen.
- Karteikarte kennt nur gewusst/nicht gewusst, kein halber Fehler.
- Tesseract läuft komplett aus der eigenen App (kein CDN), Sprachdaten `best_int` für Englisch, Französisch, Deutsch (ca. 5 MB, werden erst beim ersten Scan geladen). Neue Sprache: `@tesseract.js-data/<code>` installieren und in `TESSERACT_LANGS` eintragen.
- Gemini-Modell ist der Alias `gemini-flash-latest`, damit kein Modellname veraltet.
- Gemini: Bei Überlastung (HTTP 5xx) bis zu zwei automatische Wiederholungen nach 2 und 5 s. Bei 429 keine Wiederholung. Fehlermeldungen nennen den HTTP-Code oder Abbruchgrund.
- Fotos werden auf 1600 px verkleinert, nur im Speicher gehalten und nach der Erkennung verworfen.
- Gemini-Bedingungen (geprüft 2026-10, Originalseite war aus der Arbeitsumgebung nicht erreichbar): Nutzung ab 18, in EU/CH/UK sehen die Bedingungen für Apps bezahlte Dienste vor, dafür keine Nutzung der Daten zum Training. Entscheidung: wie geplant optional, Hinweis in den Einstellungen, Key erstellt ein Erwachsener.

## Offene Punkte

- Fehlertoleranz: Akzente (Französisch), mehrere richtige Antworten, Artikel.
- Reihenfolge der Lernmodi im Menü (vorläufig: Karteikarte, Multiple Choice, Tippen, Hören und Schreiben, Matching).
- Gemini-Bedingungen bei Gelegenheit direkt auf ai.google.dev gegenlesen.
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
