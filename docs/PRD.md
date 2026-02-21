# Product Requirements Document

## Vision
Eine browserbasierte iPad-Ausleihverwaltung für Schulen, die das umständliche Excel-Handling ersetzt. Lehrkräfte und Schuladministratoren können Ausleihen und Rückgaben schnell erfassen, den aktuellen Status aller Geräte einsehen und eine vollständige Ausleihhistorie abrufen – ohne Tabellenkalkulationen.

## Target Users
**Schuladministratoren / Lehrkräfte** – Personen, die iPads und andere Schulgeräte verwalten und verleihen.
- Schmerz: Excel ist unübersichtlich, mehrere Spalten pro Ausleihvorgang, keine einfache Übersicht über den aktuellen Status
- Bedürfnis: Schnelle Erfassung von Ausleihen/Rückgaben, vollständige Protokollierung, einfache Auswertung
- Nutzungskontext: Einzelperson (kein Login erforderlich), Desktop-Browser im Schulnetzwerk

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Geräteverwaltung | Planned |
| P0 (MVP) | Ausleih- & Rückgabeverwaltung | Planned |
| P0 (MVP) | Ausleihhistorie | Planned |
| P1 | CSV-Import (Excel-Migration) | Planned |
| P1 | Suche & Filter | Planned |
| P2 | Statistiken & Auswertungen | Planned |

## Success Metrics
- Alle Ausleihen und Rückgaben werden vollständig in der App erfasst (keine Excel-Nutzung mehr)
- Aktueller Status jedes Geräts ist auf einen Blick erkennbar
- Ausleihhistorie eines Geräts in unter 5 Sekunden abrufbar
- Bestandsdaten aus Excel können per CSV-Import migriert werden

## Constraints
- Einzelnutzer – kein Login / keine Authentifizierung notwendig
- Datenspeicherung: Supabase (PostgreSQL), kostenloser Tier ausreichend
- Browser-only (kein Mobile App)
- Technologie-Stack: Next.js, Tailwind CSS, shadcn/ui, Supabase

## Non-Goals
- Keine Benutzerkonten oder Rollen
- Keine Benachrichtigungen (z.B. bei überfälliger Rückgabe) – in dieser Version
- Keine Mobile App
- Keine Multi-Schule-Unterstützung
- Keine automatische Synchronisation mit Excel

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
