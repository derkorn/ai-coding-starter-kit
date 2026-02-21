# PROJ-6: Statistiken & Auswertungen

## Status: Planned
**Created:** 2026-02-21
**Last Updated:** 2026-02-21

## Dependencies
- Requires: PROJ-1 (Geräteverwaltung)
- Requires: PROJ-2 (Ausleih- & Rückgabeverwaltung)
- Requires: PROJ-3 (Ausleihhistorie) – historische Daten für Auswertungen

## User Stories
- Als Admin möchte ich eine Übersicht über die Gesamtnutzung der Geräte sehen, damit ich erkennen kann, welche Geräte viel oder wenig genutzt werden.
- Als Admin möchte ich sehen, welche Geräte aktuell am längsten ausgeliehen sind, damit ich ggf. nachfragen kann.
- Als Admin möchte ich die häufigsten Ausleiher (Schüler/Klassen) sehen, damit ich Muster erkennen kann.
- Als Admin möchte ich die durchschnittliche Ausleihdauer je Gerät sehen, damit ich die Gerätenutzung besser einschätzen kann.

## Acceptance Criteria
- [ ] Kennzahlen-Übersicht: Geräte gesamt, aktuell ausgeliehen, aktuell verfügbar, Ausleihen gesamt (aller Zeiten)
- [ ] Tabelle "Längste aktive Ausleihen": Gerät, Ausleiher, Klasse, Ausgabedatum, Tage ausgeliehen (absteigend sortiert)
- [ ] Tabelle "Häufigste Ausleiher": Name, Klasse, Anzahl Ausleihen (absteigend)
- [ ] Tabelle "Geräteauslastung": Gerät, Anzahl Ausleihen gesamt, Gesamtausleihtage, Durchschnittliche Ausleihdauer
- [ ] Alle Tabellen zeigen maximal Top 10 Einträge
- [ ] Bei keinen Daten: leerer Zustand mit Hinweis

## Edge Cases
- Keine Ausleihdaten vorhanden → leere Zustände, keine Fehler
- Alle Geräte verfügbar → "Längste aktive Ausleihen" zeigt leeren Zustand
- Ausleihe mit 0 Tagen Dauer → korrekte Berechnung (0 oder < 1 Tag)
- Schüler mit gleichem Namen → werden als separate Einträge gezählt

## Technical Requirements
- Berechnungen können clientseitig oder per API-Abfrage erfolgen
- Keine Echtzeit-Aktualisierung erforderlich (Seite neu laden genügt)
- Browser Support: Chrome, Firefox, Safari

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

Neue Seite `/stats` als Server Component. Alle Auswertungen werden serverseitig in einem einzigen DB-Query (Loans + Device JOIN) berechnet — kein Client-State, keine SQL-Aggregatfunktionen.

### Neue Dateien
- `src/app/stats/page.tsx` — 4 Kennzahlen-Karten + 3 Tabellen (Top 10 je)

### Geaenderte Dateien
- `src/lib/actions/queries.ts` — neue Funktion `getStatistics()`
- `src/components/nav-header.tsx` — Link "Statistiken" ergaenzt

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
