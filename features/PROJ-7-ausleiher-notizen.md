# PROJ-7: Ausleiher-Notizen

## Status: Planned
**Created:** 2026-02-21
**Last Updated:** 2026-02-21

## Dependencies
- Requires: PROJ-1 (Geräteverwaltung) – Gerätdetailseite zeigt Notizen in der Historie
- Requires: PROJ-2 (Ausleih- & Rückgabeverwaltung) – Notizen werden beim Ausleihen angezeigt
- Requires: PROJ-3 (Ausleihhistorie) – Notizen erscheinen in der Ausleih-Historie

## Kontext
Ausleiher (Schüler) sind im System nicht als eigenständige Objekte gespeichert – sie werden durch **Nachname + Vorname + Klasse** identifiziert. Eine Notiz gilt für diese Kombination und ist bei allen Ausleihen dieser Person sichtbar.

## User Stories
- Als Admin möchte ich zu einem Ausleiher eine Freitextnotiz hinterlegen (z.B. „Stift mitgegeben", „iPad-Hülle fehlt", „hat Gerät verloren"), damit diese Information bei künftigen Ausleihen sichtbar ist.
- Als Admin möchte ich beim Erfassen einer neuen Ausleihe eine Warnung sehen, wenn die Person bereits eine Notiz hat, damit ich auf Besonderheiten aufmerksam werde.
- Als Admin möchte ich Notizen in der Ausleih-Historie eines Geräts sehen, damit ich den Kontext vergangener Ausleihen verstehe.
- Als Admin möchte ich eine bestehende Notiz bearbeiten oder löschen können, damit veraltete Informationen entfernt werden.
- Als Admin möchte ich eine Notiz direkt aus der Ausleih-Historie heraus anlegen oder bearbeiten, ohne eine separate Seite aufrufen zu müssen.

## Acceptance Criteria
- [ ] In der Ausleih-Historie (`/devices/[id]`) zeigt jede Zeile ein Notiz-Icon/Button, wenn eine Notiz für diesen Ausleiher existiert
- [ ] Klick auf das Icon öffnet die Notiz als Tooltip oder kleinen Infobereich
- [ ] Über einen "Notiz bearbeiten"-Button kann die Notiz inline oder per Dialog geändert werden
- [ ] Neues Ausleihen-Formular (PROJ-2 Dialog): Wenn für den eingegebenen Nachnamen + Vornamen + Klasse eine Notiz existiert, wird diese als gelber Hinweis angezeigt
- [ ] Notiz kann aus der Ausleih-Historie heraus neu angelegt werden (auch wenn noch keine existiert)
- [ ] Notiz kann gelöscht werden (mit Bestätigungsdialog)
- [ ] Notiz ist Freitext, max. 500 Zeichen
- [ ] Notiz-Warnung im Ausleih-Dialog wird erst nach Eingabe aller drei Felder (Nachname, Vorname, Klasse) geprüft
- [ ] Eine Person ohne Notiz zeigt kein Icon / keinen Hinweis

## Edge Cases
- Dieselbe Person (gleicher Name + Klasse) hat Ausleihen an verschiedenen Geräten → Notiz erscheint bei allen Geräten in der Historie
- Name ändert sich leicht (z.B. Tippfehler in Klasse) → wird als andere Person behandelt, keine Notiz-Übertragung
- Notiz-Text enthält Sonderzeichen, Umlaute → korrekt gespeichert und angezeigt
- Leere Notiz abspeichern → nicht erlaubt (Validierung: mind. 1 Zeichen)
- Notiz nach Rückgabe des Geräts angelegt → rückwirkend in der Historie sichtbar
- Sehr langer Text (nahe 500 Zeichen) → Zeichenzähler im Eingabefeld

## Technical Requirements
- Notizen werden serverseitig in einer neuen Tabelle `borrower_notes` gespeichert
- Identifikation eines Ausleihers: `last_name + first_name + class` (case-insensitive Vergleich)
- Keine separate Personenverwaltung / keine Benutzeraccounts
- Max. 500 Zeichen Freitext
- Keine Authentifizierung erforderlich

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Datenbankschema

Neue Tabelle `borrower_notes`:

```
Jede Notiz hat:
- Eindeutige ID (UUID)
- Nachname, Vorname, Klasse (zusammen eindeutiger Schlüssel, case-insensitive)
- Notiztext (max. 500 Zeichen)
- Angelegt am / Zuletzt geändert am (Zeitstempel)
```

Wichtig: Die Kombination (Nachname + Vorname + Klasse) ist eindeutig — eine Person hat maximal eine Notiz. Beim Speichern wird automatisch entweder eine neue Notiz angelegt oder die bestehende überschrieben (Upsert).

### Komponentenbaum

```
Gerätdetail-Seite (/devices/[id])  ← bestehend, erweitert
+-- Ausleihverlauf-Tabelle  ← bestehend, erweitert
    +-- Zeile je Ausleihe
        +-- Vorname, Nachname, Klasse, Ausgabe, Rückgabe, Dauer  ← bestehend
        +-- Notiz-Spalte  ← NEU
            +-- Notiz-Badge + Kurztext (wenn Notiz vorhanden)
            +-- "Notiz hinzufügen"-Button (wenn keine Notiz)
            +-- Klick → öffnet Notiz-Dialog

Notiz-Dialog (neues Komponente, modal)
+-- Titel: "Notiz für [Vorname Nachname]"
+-- Textarea (Freitext, Zeichenzähler bis 500)
+-- Speichern-Button
+-- Löschen-Button (nur wenn Notiz bereits vorhanden, mit Bestätigung)
+-- Abbrechen-Button

Dialog: Ausleihe erfassen  ← bestehend, erweitert
+-- Vorname / Nachname / Klasse  ← bestehend
+-- Notiz-Warnung  ← NEU
    +-- Gelber Alert: "Hinweis zu [Name]: [Notiztext]"
    +-- Erscheint automatisch sobald alle 3 Felder ausgefüllt sind
```

### Ablauf: Notiz in der Ausleih-Historie

```
1. Admin öffnet Gerätdetailseite → Ausleihhistorie wird geladen
2. Alle Ausleiher in der Liste werden geprüft: Existiert eine Notiz?
3. Zeilen mit Notiz zeigen Badge + Kurztext
4. Klick auf Badge/Button → Notiz-Dialog öffnet sich
5. Admin bearbeitet Text → Speichern → Notiz gespeichert, Dialog schließt
6. Admin klickt "Löschen" → Bestätigungs-Snackbar → Notiz gelöscht
```

### Ablauf: Warnung beim Ausleihen

```
1. Admin öffnet "Ausleihe erfassen"-Dialog
2. Admin füllt Nachname + Vorname + Klasse aus
3. Sobald alle 3 Felder ausgefüllt → System prüft automatisch auf Notiz
4. Notiz vorhanden → gelber Alert erscheint mit dem Notiztext
5. Admin sieht die Warnung und kann trotzdem speichern
```

### Neue Dateien

| Datei | Zweck |
|---|---|
| `supabase/migrations/002_borrower_notes.sql` | Neue Tabelle + Index + RLS |
| `src/lib/actions/borrower-notes.ts` | Server Actions: laden, speichern, löschen |
| `src/components/loans/borrower-note-dialog.tsx` | Dialog: Notiz anlegen / bearbeiten / löschen |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/app/devices/[id]/page.tsx` | Notizen für alle Ausleiher der Seite vorab laden |
| `src/app/devices/[id]/device-detail-actions.tsx` | Notiz-Spalte + Dialog in Verlaufstabelle einbauen |
| `src/components/loans/create-loan-dialog.tsx` | Notiz-Warnung einbauen (Client-seitige Abfrage nach Feldänderung) |
| `src/lib/database.types.ts` | Neuer Typ `BorrowerNote` |

### Tech-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Speichern | Upsert (anlegen oder überschreiben) | Eine Person = eine Notiz, kein separates Create/Update nötig |
| Personenidentifikation | Nachname + Vorname + Klasse (lowercase) | Kein Benutzerkonto nötig, einfachste Lösung |
| Notiz-Lookup im Ausleihen-Dialog | Server Action bei Eingabe (nach Debounce) | Notiz ist in der DB, kein lokaler Cache nötig |
| Notizen laden in Detailseite | Alle Notizen für die Ausleiher der Seite auf einmal | Vermeidet N+1 Abfragen (eine DB-Abfrage statt eine pro Zeile) |
| UI | Bestehende shadcn/ui-Komponenten (Dialog, Textarea, Alert, Badge) | Keine neuen Pakete nötig |

### Abhängigkeiten (neu)
Keine — alle benötigten shadcn/ui-Komponenten (Dialog, Textarea, Alert) sind bereits installiert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
