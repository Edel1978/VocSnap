# Übergabe

Diese Datei hält den Stand fest, damit die Arbeit an anderer Stelle (zum Beispiel lokal) ohne Neu-Einlesen weitergeht. Nach jeder Etappe aktualisieren.

Lesereihenfolge für einen Neueinstieg: `CLAUDE.md`, `SPEC.md`, diese Datei.

## Stand

| Etappe | Status | Notizen |
|---|---|---|
| E0 Fundament | fertig | Gerüst, Datenmodell, Store, Anbieter-Schnittstelle, Einstellungen, Dark Mode, Pages-Workflow |
| E1 Nutzbarer Kern | offen | |
| E2 Scan | offen | |
| E3 Lernmodi | offen | |
| E4 Klassenarbeit und Matching | offen | |
| E5 Motivation und Feinschliff | offen | |

Status: offen / in Arbeit / fertig.

## Guthaben

| Nach Etappe | Verbraucht | Rest |
|---|---|---|
| E0 | bitte nachtragen | bitte nachtragen |

Der Verbrauch ist in der Sitzung nicht sichtbar und muss in der Abrechnung nachgesehen werden.

Startguthaben: 99 $. Ab ca. 70 % Verbrauch nur noch Fehlerbehebung und Feinschliff.

## Nächste Schritte

1. GitHub Pages einmalig aktivieren: Repo → Settings → Pages → Source „GitHub Actions". Danach baut und veröffentlicht jeder Push auf `main` die App (`.github/workflows/deploy.yml`, vorher Tests).
2. E1 beginnen (siehe `SPEC.md`, Abschnitt 6).

## Aufbau (Stand E0)

| Pfad | Inhalt |
|---|---|
| `src/data/types.ts` | Datensätze (Profile, Lesson, Word, ReviewEvent) mit Sync-Pflichtfeldern |
| `src/data/store.ts` | `Store`-Schnittstelle, einziger Datenzugang der UI |
| `src/data/dexieStore.ts` | Umsetzung mit Dexie, Löschen per `deleted_at` |
| `src/data/db.ts` | Dexie-Schema, `MIGRATIONS`-Liste, `SCHEMA_VERSION` = Anzahl Einträge |
| `src/data/device.ts` | Geräte-ID (localStorage) |
| `src/config/providers.ts` | Anbieter, Modellnamen, Key-Bedarf |
| `src/providers/` | Scan-Schnittstelle (`OcrProvider`, `ScanResult`, `ScanError`), Auswahl mit Rückfall auf Tesseract. Erkennung selbst noch Platzhalter |
| `src/settings/settings.ts` | Geräte-Einstellungen inkl. Keys, Prüfung beim Laden, localStorage |
| `src/modes/modes.ts` | Kennungen und Standard-Reihenfolge der Lernmodi |
| `src/ui/` | Hash-Routing, Startseite, Einstellungen. Zugriff auf Daten über `useApp().store` |

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
- Richtung im Datenmodell: `to_target` / `to_source`, Ergebnis: `correct` / `half` / `wrong`.

## Offene Punkte

- Fehlertoleranz: Akzente (Französisch), mehrere richtige Antworten, Artikel.
- Reihenfolge der Lernmodi im Menü (vorläufig: Karteikarte, Multiple Choice, Tippen, Hören und Schreiben, Matching).
- Nutzungsbedingungen der kostenlosen Gemini-Stufe vor E2 prüfen, ebenso den Modellnamen in `src/config/providers.ts`.
- Export/Import-Format und Migration älterer Export-Dateien folgen in E1.
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
