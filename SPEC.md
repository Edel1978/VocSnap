# VocSnap – Spezifikation

Stand: 2026-10-17 · Version 1.0 (Planung)

## 1. Ziel

VocSnap ist eine Vokabel-App für den Browser (PWA). Vokabelseite fotografieren, Wörter erkennen lassen, kurz prüfen, speichern und mit verschiedenen Lernmodi abfragen. Läuft hauptsächlich auf dem Smartphone, zusätzlich auf Tablet und Laptop. Daten liegen lokal auf dem Gerät.

Zielgruppe: Schüler am Gymnasium. Erste Sprachen: Englisch und Französisch. Weitere Sprachen sollen ohne Umbau möglich sein.

Leitlinien:
- Schlicht, modern, Dark Mode, Mobile First.
- Wenige Klicks bis zum Lernen. Keine Werbung, keine Abo-Hürden, keine Fehlerlimits.
- Lernen funktioniert immer auch ohne Internet.
- Grundversion kostenlos. Bezahlversion ist nur vorbereitet, nicht gebaut.

## 2. Technik

| Bereich | Entscheidung |
|---|---|
| Framework | React, TypeScript, Vite, Tailwind |
| Speicher | IndexedDB (z. B. über Dexie), Zugriff nur über die Speicherschicht (siehe 4) |
| PWA | Service Worker, installierbar, Lernen offline |
| Hosting | GitHub Pages (öffentliches Repo), später beliebiger Webspace. Hash-Routing, Basis-Pfad aus Konfiguration |
| Texterkennung | Anbieter-Schicht (siehe 5) |
| Tests | Vitest für Logik (Leitner, Fehlertoleranz, Import-Parser, Datenmodell) |
| Sprache der Oberfläche | Deutsch |

## 3. Funktionen

### Vokabeln erfassen
- Von Hand eingeben und bearbeiten (immer verfügbar, auch offline).
- Text aus der Zwischenablage einfügen und in Vokabelpaare zerlegen, mit Prüfansicht.
- Foto-Scan (Kamera oder Datei) mit Prüftabelle. Das Foto wird nach der Erkennung gelöscht.
- Import/Export als JSON-Datei.

### Informationen pro Vokabel
Begriff, Übersetzung, Beispielsatz, Warnhinweis „Falscher Freund", Wortart, Lektion. Beispielsatz und Warnhinweis liefert die KI beim Scan (nur mit Key), sie sind immer auch von Hand eintragbar.

### Lernmodi
Alle Modi arbeiten in beide Richtungen (Fremdsprache → Deutsch, Deutsch → Fremdsprache) und haben dieselbe Schnittstelle, sodass neue Modi ergänzt werden können.

1. **Karteikarte umdrehen.** Bestätigung wählbar in den Einstellungen: umdrehen und selbst bewerten, oder Swipe (rechts = gewusst, links = nicht gewusst).
2. **Multiple Choice** (4 Antworten).
3. **Tippen** mit Fehlertoleranz.
4. **Wort hören und schreiben** (Sprachausgabe des Geräts).
5. **Matching** (Wörter und Übersetzungen zuordnen).

Reihenfolge im Menü: wie oben. Die Reihenfolge ist eine Einstellung und kann leicht geändert werden.

### Fehlertoleranz (Tippen, Hören und Schreiben)
- Richtig: Eingabe stimmt.
- Halber Fehler: Antwort ist inhaltlich richtig, aber genau ein Buchstabe weicht ab oder nur Groß-/Kleinschreibung ist falsch.
- Falsch: alles andere.
- Offen, später klären: Akzente im Französischen, mehrere richtige Antworten, Artikel.

### Lernstand
- Leitner-System mit 5 Fächern. Standardabstände (einstellbar): 1, 2, 4, 8, 16 Tage.
- Falsch → zurück in Fach 1. Halber Fehler → Fach bleibt gleich. Richtig → ein Fach höher.
- „Fehler wiederholen" als eigene Runde.
- Der Lernstand wird aus den Abfrage-Ereignissen berechnet (siehe 4).

### Klassenarbeits-Plan
Datum der Arbeit und Lektionen wählen, die App erstellt einen Lernplan pro Tag und zeigt, was heute dran ist. Baut auf den Leitner-Daten auf.

### Motivation
XP, Level, Streak, Tagesziel, Badges, Konfetti. Lokale Bestenliste pro Profil. Beim Start ein Hinweis, falls heute noch nicht gelernt wurde (keine Push-Benachrichtigungen).

### Profile
Mehrere Profile pro Gerät mit getrenntem Lernstand.

### Einstellungen
Anbieter und Key, Design (hell/dunkel), Karteikarten-Bestätigung, Tagesziel, Menü-Reihenfolge der Modi.

## 4. Datenmodell (sync-fähig von Anfang an)

Der spätere Abgleich zwischen mehreren Geräten ist nicht Teil der ersten Etappen, das Datenmodell wird aber von Anfang an dafür gebaut.

**Regeln für alle synchronisierbaren Datensätze**
- ID ist eine UUID, keine fortlaufende Nummer.
- Pflichtfelder: `id`, `created_at`, `updated_at`, `deleted_at` (leer = aktiv, gelöscht wird nur markiert), `device_id`.
- Datenbank hat eine `schema_version`, Änderungen laufen über Migrationen.

**Tabellen**

| Tabelle | Wichtige Felder |
|---|---|
| Profile | name, avatar, `account_id` (leer, für späteres Konto), `plan` (Standard „free") |
| Lesson | profile_id, title, `source_lang`, `target_lang`, `exam_date` (optional) |
| Word | lesson_id, term, translation, example_sentence, warning_note, word_type, image (leer, für später) |
| ReviewEvent | word_id, profile_id, direction, mode, result (richtig / halb / falsch), at |

**Lernstand = Ereignisliste.** `ReviewEvent`s werden nur angehängt, nie geändert. Fach, nächstes Datum, XP und Streak werden daraus berechnet. Ein Zwischenspeicher darf existieren, muss aber jederzeit neu aufbaubar sein. So lassen sich Daten von zwei Geräten später ohne Konflikte zusammenführen.

**Nicht synchronisiert (nur pro Gerät):** API-Keys, Einstellungen, Fotos.

**Speicherschicht.** Die Oberfläche greift nie direkt auf IndexedDB zu, sondern über eine Schnittstelle (`Store`). Später kommt eine zweite Umsetzung dazu, die mit einem Server abgleicht.

**Export-Datei = Austauschformat.** Das JSON für Export/Import enthält `schema_version` und alle Tabellen und ist zugleich das spätere Sync-Format.

**Konfliktregel für später:** Bei Vokabeln gewinnt die jüngste Änderung (`updated_at`), Ereignisse werden vereinigt.

## 5. Anbieter-Schicht (Texterkennung)

Eine Schnittstelle, mehrere Anbieter. Jeder liefert dasselbe JSON-Format an die Prüftabelle.

| Anbieter | Rolle |
|---|---|
| Tesseract.js | Standard, kostenlos, offline, keine KI-Extras. Schwächer bei Handschrift |
| Gemini | Optional mit kostenlosem Key. Liefert zusätzlich Beispielsatz und Warnhinweis |
| Weitere (z. B. Claude) | Über dieselbe Schnittstelle nachrüstbar |

- Ohne Key ist automatisch Tesseract aktiv.
- Modellnamen und Anbieter-Konfiguration stehen in **einer** Datei (`src/config/providers.ts`).
- Keys werden nur lokal im Gerät gespeichert, nie im Repo.
- Vor dem Bau von E2: aktuelle Nutzungsbedingungen und Limits der kostenlosen Stufe prüfen (Alter, Region, Datennutzung).
- Der Key wird von einem Erwachsenen erstellt.

## 6. Etappenplan

Jede Etappe hinterlässt eine lauffähige App. Nach jeder Etappe wird `HANDOFF.md` aktualisiert.

| Etappe | Inhalt |
|---|---|
| **E0 Fundament** | Projektgerüst, Datenmodell, Speicherschicht, Anbieter-Schnittstelle, Einstellungen, Dark Mode, Deployment auf GitHub Pages, Doku |
| **E1 Nutzbarer Kern** | Profile, Lektionen, manuelle Eingabe, Zwischenablage-Import, Karteikarten (beide Richtungen, Umdrehen und Swipe), Fehler wiederholen, Start-Hinweis, Export/Import |
| **E2 Scan** | Foto-Scan mit Tesseract und Gemini, Prüftabelle, Beispielsatz und Warnhinweis (nur mit Key), Foto wird gelöscht |
| **E3 Lernmodi** | Leitner, Multiple Choice, Tippen, Hören und Schreiben, Fehlertoleranz |
| **E4 Klassenarbeit und Matching** | Lernplan zum Prüfungsdatum, Matching-Spiel |
| **E5 Motivation und Feinschliff** | XP, Level, Streak, Tagesziel, Badges, lokale Bestenliste, Platzhalter-Grafiken, Offline/PWA, Mobile-Feinschliff |

**Später (nach dem Guthaben, lokal weitergebaut):** Sync und Konten, Wettkampf zwischen Profilen, KI-Chat/Rollenspiel, Objekt-Scanner, Anzeige „Falsche Freunde" im Abfragemodus, Bilder zu Vokabeln, Bezahlversion, weitere Sprachen.

## 7. Nicht-Ziele (vorerst)

- Push-Benachrichtigungen, Unsplash-Bildsuche.
- Server, Konten, Sync (nur vorbereitet).
- Werbung, Abos.

## 8. Datenschutz und Sicherheit

- Daten liegen lokal auf dem Gerät. Regelmäßig exportieren, Browserspeicher kann gelöscht werden.
- Fotos werden nach der Erkennung gelöscht.
- KI-Chat (später): nur Lernthema, kindgerechte Schutzregeln.
- Das Repository ist öffentlich und enthält keine privaten Inhalte: keine Fotos, keine Schulbuchinhalte, keine Namen, keine Keys.
