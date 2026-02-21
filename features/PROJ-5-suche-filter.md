# PROJ-5: Suche & Filter

## Status: Planned
**Created:** 2026-02-21
**Last Updated:** 2026-02-21

## Dependencies
- Requires: PROJ-1 (Geräteverwaltung)
- Requires: PROJ-2 (Ausleih- & Rückgabeverwaltung)

## User Stories
- Als Admin möchte ich die Geräteliste nach Status filtern (alle / verfügbar / ausgeliehen), damit ich schnell sehe, welche Geräte gerade frei sind.
- Als Admin möchte ich nach Seriennummer oder Gerätebezeichnung suchen, damit ich ein bestimmtes Gerät schnell finde.
- Als Admin möchte ich nach dem Ausleihenden (Vor-/Nachname) suchen, damit ich herausfinden kann, welches Gerät eine bestimmte Person hat.
- Als Admin möchte ich nach Klasse filtern, damit ich alle Geräte einer bestimmten Klasse sehe.
- Als Admin möchte ich mehrere Filter gleichzeitig kombinieren können.

## Acceptance Criteria
- [ ] Suchfeld (Freitext): durchsucht Seriennummer, Gerätebezeichnung und Ausleihername (Vor-/Nachname) in Echtzeit
- [ ] Statusfilter: Dropdown oder Tabs mit "Alle", "Verfügbar", "Ausgeliehen"
- [ ] Klassenfilter: Dropdown mit allen vorhandenen Klassen (dynamisch aus Daten)
- [ ] Alle Filter können kombiniert werden (AND-Verknüpfung)
- [ ] Suchergebnisse aktualisieren sich ohne Seitenneuladen (clientseitig)
- [ ] "Keine Ergebnisse"-Zustand mit klarer Meldung und Option zum Zurücksetzen der Filter
- [ ] Aktive Filter sind sichtbar und einzeln löschbar
- [ ] Filter-Zustand bleibt beim Navigieren erhalten (z.B. URL-Parameter)

## Edge Cases
- Suche mit Sonderzeichen (Umlaute ä, ö, ü) → funktioniert korrekt
- Suche nach Teilstring ("iPad 0" findet "iPad 01", "iPad 02") → Substring-Suche
- Klassenfilter bei noch keinen Ausleihen → leer / deaktiviert
- Alle Filter zurücksetzen → zeigt wieder alle Geräte
- Kein Gerät entspricht der Kombination der Filter → leerer Zustand

## Technical Requirements
- Filterung erfolgt clientseitig (kein API-Call je Tastendruck)
- Klassenfilter-Liste wird aus den vorhandenen Ausleih-Daten dynamisch generiert
- URL-Parameter für Filterstate (z.B. `?status=loaned&class=5a`)
- Browser Support: Chrome, Firefox, Safari

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Ansatz: Client-seitige Filterung mit URL-Parametern

Alle Gerätedaten werden einmalig vom Server geladen. Die Filterung passiert vollständig im Browser — kein Netzwerk-Request pro Tastendruck. Der Filter-Zustand wird in der URL gespeichert (`?q=...&status=loaned&class=5a`), sodass er beim Navigieren erhalten bleibt.

### Komponentenbaum

```
Startseite (/)  <- Server Component (unveraendert)
+-- StatsCards
+-- "Neues Geraet"-Button
+-- Suspense-Wrapper
    +-- DeviceFilterView  <- NEU, Client Component
        +-- Suchfeld (Text-Input mit Lupe)
        +-- Status-Filter (Alle / Verfuegbar / Ausgeliehen als Toggle-Buttons)
        +-- Klassen-Filter (Dropdown, dynamisch aus aktiven Ausleihen)
        +-- Aktive Filter (Chips mit X-Button je Filter)
        +-- "Alle zuruecksetzen"-Button (nur wenn Filter aktiv)
        +-- DeviceTable (bestehend, erhaelt gefilterte Geraételiste)
        +-- Leerer Zustand (wenn keine Treffer)
```

### Filter-Logik (AND-Verknuepfung)

| Filter | Sucht in |
|---|---|
| Freitext (`?q=`) | Seriennummer, Bezeichnung, Ausleiher-Vorname, Ausleiher-Nachname |
| Status (`?status=available\|loaned`) | `isLoaned`-Feld des Geraets |
| Klasse (`?class=5a`) | `borrower_class` der aktiven Ausleihe |

### Neue Dateien

- `src/components/devices/device-filter-view.tsx` — Filter-UI + Filterlogik + DeviceTable

### Geaenderte Dateien

- `src/app/page.tsx` — DeviceTable durch DeviceFilterView ersetzt, Suspense-Wrapper ergaenzt

### Tech-Entscheidungen

| Entscheidung | Wahl | Begruendung |
|---|---|---|
| Filterung | Client-seitig (kein API-Call) | Alle Daten bereits geladen, schnelle Reaktion ohne Netzwerkverzoegerung |
| URL-Zustand | `useSearchParams` + `router.replace` | Filter bleiben beim Zurueck-Navigieren erhalten, teilbar als Link |
| Suspense | Wrapper um DeviceFilterView | `useSearchParams` benoetigt Suspense-Boundary in Next.js App Router |

### Abhaengigkeiten (neu)
Keine — `useSearchParams`, `useRouter` aus Next.js bereits verfuegbar.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
