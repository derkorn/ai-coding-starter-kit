# PROJ-1: Geräteverwaltung

## Status: Planned
**Created:** 2026-02-21
**Last Updated:** 2026-02-21

## Dependencies
- None

## User Stories
- Als Admin möchte ich alle iPads in einer Übersicht sehen, damit ich auf einen Blick erkenne, welche verfügbar oder ausgeliehen sind.
- Als Admin möchte ich ein neues Gerät mit Seriennummer anlegen, damit es im System verwaltet werden kann.
- Als Admin möchte ich die Bezeichnung eines Geräts bearbeiten, damit ich Fehler korrigieren kann.
- Als Admin möchte ich den aktuellen Ausleihstatus direkt in der Geräteliste sehen (inkl. aktuellem Ausleiher), damit ich keine Details öffnen muss.
- Als Admin möchte ich ein Gerät löschen können (nur wenn keine aktive Ausleihe), damit veraltete Geräte entfernt werden können.

## Acceptance Criteria
- [ ] Geräteliste zeigt alle Geräte mit Spalten: Seriennummer, Bezeichnung, Status (Verfügbar / Ausgeliehen), aktueller Ausleiher (Name + Klasse, wenn ausgeliehen)
- [ ] Neues Gerät anlegen: Seriennummer (Pflichtfeld, eindeutig) + Bezeichnung (Pflichtfeld, z.B. "iPad 01")
- [ ] Seriennummer kann nach dem Anlegen nicht mehr geändert werden
- [ ] Bezeichnung des Geräts ist bearbeitbar
- [ ] Gerät kann nur gelöscht werden, wenn keine aktive Ausleihe vorliegt
- [ ] Der Status (Verfügbar/Ausgeliehen) wird automatisch aus den Ausleih-Daten abgeleitet
- [ ] Bei noch keinem Gerät: Leerer Zustand mit Hinweis und Button zum Anlegen
- [ ] Anzahl der Geräte gesamt, verfügbar und ausgeliehen wird als Zusammenfassung oben angezeigt

## Edge Cases
- Doppelte Seriennummer beim Anlegen → Fehlermeldung "Seriennummer bereits vorhanden"
- Gerät löschen mit aktiver Ausleihe → blockiert, Warnung anzeigen
- Sehr lange Seriennummer oder Bezeichnung → korrekte Darstellung (kein Layout-Bruch)
- Leere Datenbank → Leerer Zustand wird korrekt dargestellt

## Technical Requirements
- Browser Support: Chrome, Firefox, Safari (aktuell)
- Seriennummer: alphanumerisch, max. 50 Zeichen
- Bezeichnung: max. 100 Zeichen
- Keine Authentifizierung erforderlich

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Datenbankschema (gilt für PROJ-1 bis PROJ-3)

**Tabelle `devices`**
- `id` – Eindeutige UUID (automatisch generiert)
- `serial_number` – Seriennummer, Text, eindeutig, Pflichtfeld
- `name` – Bezeichnung (z.B. "iPad 01"), Text, Pflichtfeld
- `created_at` – Zeitstempel der Anlage

**Tabelle `loans`**
- `id` – Eindeutige UUID (automatisch generiert)
- `device_id` – Verweis auf `devices.id` (bei Gerät-Löschung werden alle Ausleihen mitgelöscht)
- `borrower_first_name` – Vorname, Text, Pflichtfeld
- `borrower_last_name` – Nachname, Text, Pflichtfeld
- `borrower_class` – Klasse (z.B. "5a"), Text, Pflichtfeld
- `loaned_at` – Ausgabedatum, Datum, Pflichtfeld
- `returned_at` – Rückgabedatum, Datum, optional (leer = aktive Ausleihe)
- `created_at` – Zeitstempel der Erfassung

**Status-Logik:** Gerät ist "Ausgeliehen", wenn ein `loans`-Eintrag ohne `returned_at` existiert. Sonst "Verfügbar".

### Seitenstruktur (URL-Übersicht)

| URL | Inhalt |
|---|---|
| `/` | Geräteübersicht (diese Seite) |
| `/devices/[id]` | Gerätdetail + Ausleihhistorie (PROJ-3) |
| `/loans` | Alle aktiven Ausleihen (PROJ-3) |
| `/import` | CSV-Import (PROJ-4) |
| `/stats` | Statistiken (PROJ-6) |

### Komponentenbaum (PROJ-1)

```
Hauptseite (/)
+-- Navigation (Header mit Menü)
+-- Zusammenfassungs-Kacheln
|   +-- Kachel "Geräte gesamt"
|   +-- Kachel "Verfügbar"
|   +-- Kachel "Ausgeliehen"
+-- Aktionsleiste
|   +-- Button "Neues Gerät anlegen"
+-- Gerätetabelle
|   +-- Tabellenzeile (je Gerät)
|       +-- Seriennummer
|       +-- Bezeichnung
|       +-- Status-Badge (Verfügbar / Ausgeliehen)
|       +-- Aktueller Ausleiher (Name + Klasse, wenn ausgeliehen)
|       +-- Aktionen (Bearbeiten, Löschen)
+-- Leerer Zustand (noch keine Geräte)
+-- Dialog: Neues Gerät
|   +-- Seriennummer (Pflichtfeld)
|   +-- Bezeichnung (Pflichtfeld)
|   +-- Speichern / Abbrechen
+-- Dialog: Gerät bearbeiten
    +-- Seriennummer (schreibgeschützt)
    +-- Bezeichnung (editierbar)
    +-- Speichern / Abbrechen
```

### Tech-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Datenmutationen | Next.js Server Actions | Kein separater API-Layer nötig, weniger Code |
| Datenabruf | React Server Components | Daten beim Seitenaufruf direkt geladen, kein Ladebalken |
| Datenbank | Supabase (PostgreSQL) | Kein eigener Server, kostenloser Tier reicht, gut abfragbar |
| UI-Komponenten | shadcn/ui Table, Dialog, Badge | Bereits installiert, kein Custom-Code nötig |
| Validierung | Zod | Typsichere Eingabevalidierung auf Server und Client |
| Authentifizierung | Keine | Einzelnutzer, kein Mehrwert durch Login |

### Abhängigkeiten (npm-Pakete)
- `@supabase/supabase-js` – Supabase-Client
- `zod` – Eingabevalidierung
- `react-hook-form` – Formularhandling (bereits im Stack)

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
