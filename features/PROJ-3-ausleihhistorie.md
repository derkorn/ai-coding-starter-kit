# PROJ-3: Ausleihhistorie

## Status: Planned
**Created:** 2026-02-21
**Last Updated:** 2026-02-21

## Dependencies
- Requires: PROJ-1 (Geräteverwaltung)
- Requires: PROJ-2 (Ausleih- & Rückgabeverwaltung)

## User Stories
- Als Admin möchte ich die vollständige Ausleihhistorie eines Geräts einsehen, damit ich nachvollziehen kann, wer das Gerät wann hatte.
- Als Admin möchte ich die Ausleihdauer je Vorgang sehen, damit ich erkennen kann, ob ein Gerät ungewöhnlich lange ausgeliehen war.
- Als Admin möchte ich die aktuelle Ausleihe in der Historie als "aktiv" markiert sehen, damit ich sie von abgeschlossenen unterscheiden kann.
- Als Admin möchte ich eine Gesamtübersicht aller laufenden Ausleihen sehen (geräteübergreifend), damit ich einen schnellen Überblick habe.

## Acceptance Criteria
- [ ] Gerätdetailseite zeigt alle Ausleihvorgänge in chronologischer Reihenfolge (neueste zuerst)
- [ ] Jeder Eintrag zeigt: Vorname, Nachname, Klasse, Ausgabedatum, Rückgabedatum (oder "aktiv"), Ausleihdauer in Tagen
- [ ] Aktive Ausleihen sind visuell hervorgehoben (z.B. Badge "Aktiv")
- [ ] Ausleihdauer für aktive Ausleihen wird als "X Tage (laufend)" angezeigt
- [ ] Bei noch keiner Ausleihe: leerer Zustand mit Hinweis
- [ ] Geräteübergreifende Übersicht aller aktuell aktiven Ausleihen (alle Geräte, die gerade ausgeliehen sind)

## Edge Cases
- Gerät ohne jede Ausleihhistorie → leerer Zustand mit hilfreichem Text
- Sehr viele Einträge (>50) → Pagination oder Scroll
- Aktive Ausleihe ohne Rückgabedatum → zeigt "—" oder "noch nicht zurückgegeben"
- Ausleihdauer von 0 Tagen (gleicher Tag ausgeliehen und zurückgegeben) → "< 1 Tag" oder "0 Tage"

## Technical Requirements
- Ausleihdauer berechnet sich aus: Rückgabedatum − Ausgabedatum (in Tagen)
- Für aktive Ausleihen: Heute − Ausgabedatum
- Sortierung: neueste Ausleihe zuerst
- Browser Support: Chrome, Firefox, Safari

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Datenbankschema
Verwendet die Tabellen `devices` und `loans` aus PROJ-1. Keine zusätzlichen Tabellen nötig.

- Ausleihhistorie = alle `loans`-Einträge für eine `device_id`, sortiert nach `loaned_at` absteigend
- Aktive Ausleihen = alle `loans`-Einträge ohne `returned_at`, geräteübergreifend
- Ausleihdauer = `returned_at - loaned_at` (in Tagen), bei aktiver Ausleihe: `heute - loaned_at`

### Komponentenbaum (PROJ-3)

```
Gerätedetail-Seite (/devices/[id])
+-- Zurück-Link ("← Alle Geräte")
+-- Gerätekopf
|   +-- Bezeichnung + Seriennummer
|   +-- Status-Badge (Verfügbar / Ausgeliehen)
+-- Aktive Ausleihe (nur wenn ausgeliehen, hervorgehoben)
|   +-- Ausleiher Name + Klasse
|   +-- Ausgabedatum + "seit X Tagen"
|   +-- Button "Rückgabe erfassen" (→ PROJ-2 Dialog)
+-- Ausleihverlauf-Tabelle
|   +-- Kopfzeile: Name, Klasse, Ausgabe, Rückgabe, Dauer
|   +-- Zeile je Ausleihe
|       +-- Vor- & Nachname
|       +-- Klasse
|       +-- Ausgabedatum
|       +-- Rückgabedatum / Badge "Aktiv"
|       +-- Ausleihdauer in Tagen
+-- Leerer Zustand (noch keine Ausleihen)

Seite: Aktive Ausleihen (/loans)
+-- Seitentitel "Aktive Ausleihen"
+-- Tabelle
|   +-- Gerät (Name + Seriennummer, klickbar → /devices/[id])
|   +-- Ausleiher (Name + Klasse)
|   +-- Ausgabedatum
|   +-- Tage ausgeliehen (laufend)
|   +-- Button "Rückgabe erfassen"
+-- Leerer Zustand (alle Geräte verfügbar)
```

### Tech-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Datenabruf | React Server Components | Seite lädt schnell, kein Client-State nötig |
| Ausleihdauer | Berechnung im Frontend | Einfach, keine DB-Funktion nötig |
| Navigation | Link von Geräteliste → Detailseite | Klick auf Gerätname öffnet Detailseite |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
