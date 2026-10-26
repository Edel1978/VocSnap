# VocSnap – Arbeitsregeln

Vokabel-App als PWA. Alles Fachliche steht in `SPEC.md`, der aktuelle Stand in `HANDOFF.md`. Beides zu Beginn jeder Session lesen.

## Technik
- React, TypeScript, Vite, Tailwind. IndexedDB (Dexie). Vitest.
- Oberfläche auf Deutsch, Code und Kommentare knapp.
- GitHub Pages: Hash-Routing, Basis-Pfad aus der Vite-Konfiguration, nichts hart codieren.

## Architektur (nicht umgehen)
- Die UI greift nie direkt auf IndexedDB zu, nur über die `Store`-Schnittstelle.
- Alle synchronisierbaren Datensätze: UUID, `created_at`, `updated_at`, `deleted_at`, `device_id`. Löschen = Markierung.
- Lernstand wird aus `ReviewEvent`s berechnet. Ereignisse nur anhängen.
- Texterkennung nur über die Anbieter-Schnittstelle. Modellnamen und Anbieter-Einstellungen ausschließlich in `src/config/providers.ts`.
- Lernmodi sind austauschbare Bausteine mit gleicher Schnittstelle.
- Datenbankänderungen nur mit Migration und hochgezählter `schema_version`.

## Regeln
- Jede Etappe in fester Reihenfolge, keine neuen Funktionen mitten in einer Etappe. Ideen kommen in die Wunschliste in `HANDOFF.md`.
- Jede Etappe endet mit lauffähiger App, grünen Tests und aktualisierter `HANDOFF.md`.
- Logik mit Tests absichern (Leitner, Fehlertoleranz, Import, Migrationen). Für Oberfläche reicht manuelles Prüfen.
- Fehlerfälle behandeln: Scan schlägt fehl, kein Internet, kein Key, leere Daten.
- Lernen muss ohne Internet funktionieren.
- Nach jeder Etappe das verbrauchte Guthaben in `HANDOFF.md` notieren. Ab ca. 95 % Verbrauch nur noch Fehler beheben und Feinschliff.

## Sicherheit und Inhalte
- Nie API-Keys, Fotos, Schulbuchinhalte oder Namen ins Repo. Keys nur lokal im Gerät.
- Das Repo ist öffentlich. Keine privaten Inhalte in Code, Beispieldaten, Commits oder Doku.
- Beispieldaten erfinden, nicht aus Büchern übernehmen.

## Git
- Commit-Texte kurz und sachlich, auf Deutsch, ein Satz. Keine Co-Author-Zeilen, keine Hinweise auf KI.
- Pull-Request-Beschreibungen und README kurz halten, nicht ausschmücken.
- Kleine Commits, ein Thema pro Commit.
