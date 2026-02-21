# PROJ-4: CSV-Import (Excel-Migration)

## Status: In Progress
**Created:** 2026-02-21
**Last Updated:** 2026-02-21 (verfeinert mit echtem Spaltenformat)

## Dependencies
- Requires: PROJ-1 (Geräteverwaltung) – Geräte werden beim Import angelegt
- Requires: PROJ-2 (Ausleih- & Rückgabeverwaltung) – Ausleihvorgänge werden importiert

## Konkretes Spaltenformat (reale Excel-Datei)

Die zu importierende CSV hat folgende Spalten (Semikolon-getrennt, deutsche Spaltennamen):

```
X ; HIBBNo ; Seriennummer ; Name1 ; Vorname1 ; Klasse1 ; Ausgabe1 ; Rückgabe1 ; Status ; zus. Info zu aktuellem Benutzer ; Name2 ; Vorname2 ; Klasse2 ; Ausgabe2 ; Rückgabe2 ; Name3 ; Vorname3 ; Klasse3 ; Ausgabe3 ; Rückgabe3 ; Name4 ; Vorname4 ; Klasse4 ; Ausgabe4 ; Rückgabe4 ; Name5 ; Vorname5 ; Klasse5 ; Ausgabe5 ; Rückgabe5 ; Name6 ; Vorname6 ; Klasse6 ; Ausgabe6 ; Rückgabe6
```

**Spalten-Mapping:**
| CSV-Spalte | App-Feld | Hinweis |
|---|---|---|
| `Seriennummer` | `devices.serial_number` | Eindeutiger Schlüssel |
| `HIBBNo` | `devices.name` | Inventarnummer, z.B. "iPad-042" |
| `X` | Ignoriert | iPad-Generation (Zusatzinfo, wird nicht importiert) |
| `Name{N}` | `loans.borrower_last_name` | N = 1 bis 6 |
| `Vorname{N}` | `loans.borrower_first_name` | N = 1 bis 6 |
| `Klasse{N}` | `loans.borrower_class` | N = 1 bis 6 |
| `Ausgabe{N}` | `loans.loaned_at` | N = 1 bis 6 |
| `Rückgabe{N}` | `loans.returned_at` | Leer = aktive Ausleihe |
| `Status` | Nur zur Validierung | "ausgeliehen" / "verfügbar" |
| `zus. Info` | Ignoriert | Freitext, wird nicht importiert |

**Datenformat:** Ein Gerät pro Zeile, bis zu 6 historische Ausleihvorgänge horizontal nebeneinander.

## User Stories
- Als Admin möchte ich meine bestehende Excel-Datei als CSV exportieren und in die App hochladen, damit ich nicht 200+ Geräte manuell eingeben muss.
- Als Admin möchte ich vor dem Import eine Vorschau der erkannten Geräte und Ausleihvorgänge sehen, damit ich Fehler erkennen kann.
- Als Admin möchte ich nach dem Import einen Bericht sehen (erfolgreich / fehlerhaft), damit ich weiß, was importiert wurde.
- Als Admin möchte ich, dass die gesamte Ausleihhistorie (alle 6 Slots) je Gerät importiert wird, damit ich keine Daten verliere.
- Als Admin möchte ich, dass doppelte Seriennummern übersprungen werden, damit keine Duplikate entstehen.

## Acceptance Criteria
- [ ] CSV-Datei hochladen (Datei-Auswahl, Semikolon-getrennt)
- [ ] Spalten werden automatisch anhand der bekannten Bezeichnungen erkannt (kein manuelles Mapping nötig)
- [ ] Vorschau: Tabelle der ersten 5 Geräte mit Anzahl erkannter Ausleihvorgänge je Gerät
- [ ] Import pro Zeile: Gerät anlegen (serial_number = Seriennummer, name = HIBBNo) + alle nicht-leeren Ausleihslots (1–6) als Ausleihvorgänge
- [ ] Leerer Ausleihslot (kein Name) → wird übersprungen, kein Ausleihdatensatz
- [ ] Fehlendes Rückgabedatum → Ausleihe wird als aktiv (offen) importiert
- [ ] Duplikat (Seriennummer bereits vorhanden) → Gerät überspringen, bestehende Ausleihen bleiben unberührt
- [ ] Import-Ergebnis: Anzahl importierte Geräte, importierte Ausleihvorgänge, übersprungene Duplikate, fehlerhafte Zeilen (mit Zeilennummer + Fehlerursache)
- [ ] Fehlerhafte Zeile (z.B. ungültiges Datum) → nur diese Zeile überspringen, Rest importieren
- [ ] Ungültige Datei (kein CSV, falsche Spalten) → Fehlermeldung vor dem Import

## Edge Cases
- Seriennummer fehlt → gesamte Zeile überspringen, im Bericht anzeigen
- HIBBNo fehlt → Gerätename wird aus Seriennummer gebildet
- Ungültiges Datumsformat in Ausgabe/Rückgabe → betroffenen Slot überspringen, Rest der Zeile importieren
- Rückgabedatum vor Ausgabedatum → Slot überspringen, im Bericht anzeigen
- Mehrere offene Ausleihslots (kein Rückgabedatum) bei einem Gerät → nur den ersten als aktiv importieren, Rest mit heutigem Datum abschließen + Warnung
- Sehr große Datei (200+ Zeilen mit je 6 Slots = 1200+ Datensätze) → Import muss stabil funktionieren
- Alle Geräte bereits vorhanden (z.B. zweiter Import) → Hinweis "Keine neuen Geräte importiert"

## Technical Requirements
- Trennzeichen: Semikolon (;) – entspricht Excel-Standard für deutsche Locale
- Datumsformate: DD.MM.YYYY (Excel DE) und YYYY-MM-DD (ISO)
- Verarbeitung: vollständig im Browser (kein Server-Upload nötig), Datei wird client-seitig geparst
- Max. Dateigröße: 5 MB
- Keine Authentifizierung erforderlich

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Gesamtablauf

```
Benutzer wählt CSV-Datei
        ↓
Browser liest + parst (kein Server-Upload, kein Datei-Upload)
        ↓
Vorschau (erste 5 Geräte, Anzahl Ausleihvorgänge)
        ↓
Benutzer bestätigt → bulkImportDevices() Server Action
        ↓
Ergebnis-Bericht
```

### Komponentenbaum (3-Schritt-Wizard)

```
Import-Seite (/import)  ← Client Component
+-- Schritt-Anzeige (1 → 2 → 3)
+-- Schritt 1: Datei hochladen
|   +-- Datei-Auswahl (.csv)
|   +-- Hinweis "Excel als CSV (Semikolon) exportieren"
|   +-- Fehlermeldung bei falscher Datei/fehlenden Spalten
|   +-- "Weiter" Button
+-- Schritt 2: Vorschau & Bestätigung
|   +-- Zusammenfassung (X Geräte, Y Ausleihen erkannt, Warnungen)
|   +-- Vorschau-Tabelle (erste 5 Geräte: HIBBNo, Seriennummer, Anzahl Slots)
|   +-- "Import starten" Button
|   +-- "Zurück" Button
+-- Schritt 3: Ergebnis
    +-- Importierte Geräte / Ausleihen / Duplikate / Fehler
    +-- Fehlerhafte Zeilen (Nummer + Grund)
    +-- "Zur Geräteliste" Button
```

### Tech-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| CSV-Parsing | `papaparse` | Handhabt Encoding (Umlaute!), Semikolon, fehlerhafte Zeilen robust |
| Dateiverarbeitung | Client-seitig (Browser) | Kein Server-Upload nötig, keine Datei-Speicherung |
| Datenspeicherung | Neue Server Action `bulkImportDevices` | Batch-Import ohne "bereits ausgeliehen"-Prüfung (historische Daten) |
| Seitentyp | Client Component | Multi-Schritt-Wizard braucht lokalen State |

### Neue Dateien

- `src/app/import/page.tsx` – Import-Seite (3-Schritt-Wizard)
- `src/lib/actions/import.ts` – Server Action: `bulkImportDevices()`
- Nav-Header erhält Link "Import" → `/import`

### Abhängigkeiten (neu)
- `papaparse` + `@types/papaparse` – CSV-Parser

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
