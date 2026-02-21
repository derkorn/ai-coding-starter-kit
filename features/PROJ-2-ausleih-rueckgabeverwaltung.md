# PROJ-2: Ausleih- & Rückgabeverwaltung

## Status: Planned
**Created:** 2026-02-21
**Last Updated:** 2026-02-21

## Dependencies
- Requires: PROJ-1 (Geräteverwaltung) – Geräte müssen im System vorhanden sein

## User Stories
- Als Admin möchte ich ein verfügbares Gerät an einen Schüler ausleihen (Vorname, Nachname, Klasse, Datum), damit der Ausleihvorgang protokolliert wird.
- Als Admin möchte ich die Rückgabe eines Geräts mit Datum erfassen, damit das Gerät wieder als verfügbar markiert wird.
- Als Admin möchte ich alle aktuell aktiven Ausleihen auf einen Blick sehen, damit ich weiß, welche Geräte gerade unterwegs sind.
- Als Admin möchte ich beim Ausleihen nur verfügbare Geräte auswählen können, damit keine Doppelausleihe entsteht.

## Acceptance Criteria
- [ ] Ausleihe anlegen: Gerät auswählen (nur verfügbare werden angezeigt), Vorname, Nachname, Klasse (Pflichtfelder), Ausgabedatum (Standard: heute)
- [ ] Rückgabe erfassen: Bei aktiver Ausleihe Rückgabedatum eingeben (Standard: heute) und bestätigen
- [ ] Nach Rückgabe wechselt der Status des Geräts sofort auf "Verfügbar"
- [ ] Aktive Ausleihen sind auf der Geräteliste (PROJ-1) direkt erkennbar
- [ ] Rückgabedatum darf nicht vor dem Ausgabedatum liegen → Fehlermeldung
- [ ] Klasse wird als Freitextfeld erfasst (z.B. "5a", "10b")
- [ ] Ein bereits ausgeliehenes Gerät kann nicht erneut ausgeliehen werden → Fehlermeldung

## Edge Cases
- Versuch, ein ausgeliehenes Gerät nochmals auszuleihen → blockiert, klare Fehlermeldung
- Rückgabedatum liegt vor dem Ausgabedatum → Validierungsfehler
- Ausgabedatum in der Zukunft → erlaubt (Vorab-Reservierung)
- Fehlende Pflichtfelder beim Ausleihen → alle markieren und Hinweis zeigen
- Alle Geräte ausgeliehen → Hinweis "Keine Geräte verfügbar" bei Ausleihe-Formular

## Technical Requirements
- Datum-Picker für Ausgabe- und Rückgabedatum
- Klasse: Freitext, max. 20 Zeichen
- Vor- und Nachname: max. 100 Zeichen je
- Keine Authentifizierung erforderlich

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Datenbankschema
Verwendet die Tabellen `devices` und `loans` aus PROJ-1. Keine zusätzlichen Tabellen nötig.

- Ausleihe anlegen = neuen `loans`-Eintrag mit `returned_at = null` erstellen
- Rückgabe erfassen = `returned_at` im bestehenden `loans`-Eintrag setzen
- Gerät-Status wird immer dynamisch aus `loans` abgeleitet (kein separates Statusfeld)

### Komponentenbaum (PROJ-2)

```
Dialog: Ausleihe erfassen (von Geräteliste aufrufbar)
+-- Gerät-Anzeige (Seriennummer + Name, vorausgewählt)
    ODER Gerät-Auswahl (Dropdown, nur verfügbare)
+-- Vorname-Eingabe (Pflichtfeld)
+-- Nachname-Eingabe (Pflichtfeld)
+-- Klasse-Eingabe (Pflichtfeld, Freitext)
+-- Ausgabedatum-Picker (Standard: heute)
+-- Speichern / Abbrechen

Dialog: Rückgabe bestätigen (von Geräteliste / Detailseite)
+-- Info: Gerätename + aktueller Ausleiher (Name, Klasse, seit X Tagen)
+-- Rückgabedatum-Picker (Standard: heute)
+-- Bestätigen / Abbrechen
```

### Interaktionsfluss

1. Admin klickt "Ausleihen" bei einem verfügbaren Gerät in der Liste
2. Dialog öffnet sich, Gerät vorausgefüllt
3. Admin füllt Ausleiherdaten + Datum aus → Speichern
4. Gerät-Status wechselt sofort auf "Ausgeliehen" (optimistisches Update)

5. Admin klickt "Zurücknehmen" bei einem ausgeliehenen Gerät
6. Bestätigungsdialog mit Rückgabedatum → Bestätigen
7. Gerät-Status wechselt sofort auf "Verfügbar"

### Tech-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Statusaktualisierung | Optimistisches UI-Update | Sofortiges visuelles Feedback ohne Wartezeit |
| Datum-Validierung | Zod (Server) + Client-Validierung | Rückgabe darf nicht vor Ausgabe liegen |
| Formular | react-hook-form + Zod | Konsistent mit übrigem Stack |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
