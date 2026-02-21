"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { bulkImportDevices } from "@/lib/actions/import"
import type { ImportRow, ImportResult } from "@/lib/actions/import"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedDevice {
  serial_number: string
  name: string
  loanCount: number
  row: ImportRow
}

interface ParseWarning {
  row: number
  message: string
}

// ---------------------------------------------------------------------------
// Date parsing helpers
// ---------------------------------------------------------------------------

function parseDate(value: string): string | null {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()

  // Excel serial number (e.g. 45292 = 2024-01-01)
  // Excel counts days from 1900-01-00; Unix epoch offset is 25569 days.
  // We only accept results in the plausible range 1990–2100.
  if (/^\d+$/.test(trimmed)) {
    const serial = parseInt(trimmed, 10)
    const date = new Date((serial - 25569) * 86400 * 1000)
    const year = date.getUTCFullYear()
    if (!isNaN(date.getTime()) && year >= 1990 && year <= 2100) {
      const month = String(date.getUTCMonth() + 1).padStart(2, "0")
      const day = String(date.getUTCDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    return null
  }

  // DD.MM.YYYY
  const deMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (deMatch) {
    const day = deMatch[1].padStart(2, "0")
    const month = deMatch[2].padStart(2, "0")
    const year = deMatch[3]
    return `${year}-${month}-${day}`
  }

  // DD.MM.YY (two-digit year: 00–29 → 20xx, 30–99 → 19xx)
  const deShortMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/)
  if (deShortMatch) {
    const day = deShortMatch[1].padStart(2, "0")
    const month = deShortMatch[2].padStart(2, "0")
    const yy = parseInt(deShortMatch[3], 10)
    const year = yy < 30 ? 2000 + yy : 1900 + yy
    return `${year}-${month}-${day}`
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return trimmed
  }

  return null
}

function isDateBefore(a: string, b: string): boolean {
  return a < b
}

// ---------------------------------------------------------------------------
// CSV column validation
// ---------------------------------------------------------------------------

const REQUIRED_COLUMNS = [
  "Seriennummer",
  "HIBBNo",
  "Name1",
  "Vorname1",
  "Klasse1",
  "Ausgabe1",
]

function validateColumns(fields: string[]): string | null {
  const missing = REQUIRED_COLUMNS.filter((col) => !fields.includes(col))
  if (missing.length > 0) {
    return `Fehlende Spalten: ${missing.join(", ")}`
  }
  return null
}

// ---------------------------------------------------------------------------
// CSV row processing
// ---------------------------------------------------------------------------

function processRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[]
): {
  devices: ParsedDevice[]
  warnings: ParseWarning[]
} {
  const devices: ParsedDevice[] = []
  const warnings: ParseWarning[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2 // +2 because row 1 is header, data starts at 2

    const serialNumber = (row["Seriennummer"] ?? "").toString().trim()
    if (!serialNumber) {
      warnings.push({ row: rowNum, message: "Seriennummer fehlt, Zeile wird uebersprungen" })
      continue
    }

    const name = (row["HIBBNo"] ?? "").toString().trim() || serialNumber

    const loans: ImportRow["loans"] = []
    let hasMultipleOpenLoans = false
    let openLoanCount = 0

    for (let n = 1; n <= 6; n++) {
      const lastName = (row[`Name${n}`] ?? "").toString().trim()
      if (!lastName) continue

      const firstName = (row[`Vorname${n}`] ?? "").toString().trim()
      const klasse = (row[`Klasse${n}`] ?? "").toString().trim()
      const ausgabeRaw = (row[`Ausgabe${n}`] ?? "").toString().trim()
      const rueckgabeRaw = (row[`Rückgabe${n}`] ?? row[`Rueckgabe${n}`] ?? "").toString().trim()

      const loanedAt = parseDate(ausgabeRaw)
      if (!loanedAt) {
        if (ausgabeRaw) {
          warnings.push({
            row: rowNum,
            message: `Slot ${n}: Ungueltiges Ausgabedatum "${ausgabeRaw}"`,
          })
        }
        continue
      }

      let returnedAt = parseDate(rueckgabeRaw)

      if (returnedAt && isDateBefore(returnedAt, loanedAt)) {
        warnings.push({
          row: rowNum,
          message: `Slot ${n}: Rueckgabedatum (${rueckgabeRaw}) liegt vor Ausgabedatum (${ausgabeRaw})`,
        })
        continue
      }

      // Track open loans (no return date)
      if (!returnedAt) {
        openLoanCount++
        if (openLoanCount > 1) {
          hasMultipleOpenLoans = true
          // Close this loan with today's date
          returnedAt = new Date().toISOString().split("T")[0]
        }
      }

      loans.push({
        borrower_last_name: lastName,
        borrower_first_name: firstName,
        borrower_class: klasse,
        loaned_at: loanedAt,
        returned_at: returnedAt,
      })
    }

    if (hasMultipleOpenLoans) {
      warnings.push({
        row: rowNum,
        message: "Mehrere offene Ausleihen erkannt. Nur die erste bleibt offen, weitere wurden mit heutigem Datum abgeschlossen.",
      })
    }

    devices.push({
      serial_number: serialNumber,
      name,
      loanCount: loans.length,
      row: {
        device: { serial_number: serialNumber, name },
        loans,
      },
    })
  }

  return { devices, warnings }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<ParsedDevice[]>([])
  const [warnings, setWarnings] = useState<ParseWarning[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorsOpen, setErrorsOpen] = useState(false)

  const totalLoans = devices.reduce((sum, d) => sum + d.loanCount, 0)

  // Step 1: handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        setError("Datei ist zu gross (max. 5 MB)")
        return
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Bitte waehle eine CSV-Datei aus")
        return
      }

      Papa.parse(file, {
        delimiter: ";",
        header: true,
        skipEmptyLines: true,
        complete(results) {
          const fields = results.meta.fields ?? []
          const colError = validateColumns(fields)
          if (colError) {
            setError(colError)
            return
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { devices: parsed, warnings: w } = processRows(results.data as Record<string, any>[])

          if (parsed.length === 0) {
            setError("Keine Geraete in der Datei erkannt. Bitte ueberprüfe das Format.")
            return
          }

          setDevices(parsed)
          setWarnings(w)
          setStep(2)
        },
        error(err) {
          setError(`Fehler beim Lesen der Datei: ${err.message}`)
        },
      })
    },
    []
  )

  // Step 2: start import
  const handleImport = useCallback(async () => {
    setImporting(true)
    try {
      const rows = devices.map((d) => d.row)
      const res = await bulkImportDevices(rows)
      setResult(res)
      setStep(3)
    } catch {
      setError("Unbekannter Fehler beim Import. Bitte versuche es erneut.")
    } finally {
      setImporting(false)
    }
  }, [devices])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">CSV-Import</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2" aria-label="Import-Schritte">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <Badge
              variant={step >= s ? "default" : "outline"}
              className="h-7 w-7 justify-center rounded-full p-0 text-xs"
            >
              {s}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {s === 1 && "Datei waehlen"}
              {s === 2 && "Vorschau"}
              {s === 3 && "Ergebnis"}
            </span>
            {s < 3 && (
              <span className="mx-1 text-muted-foreground" aria-hidden="true">
                &rarr;
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Global error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STEP 1: File Upload */}
      {/* ----------------------------------------------------------------- */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>CSV-Datei hochladen</CardTitle>
            <CardDescription>
              Exportiere deine Excel-Datei als CSV (Semikolon-getrennt, UTF-8)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="csv-file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center transition-colors hover:border-muted-foreground/50"
            >
              <p className="mb-2 text-sm font-medium">CSV-Datei auswaehlen</p>
              <p className="text-xs text-muted-foreground">
                Max. 5 MB, Semikolon-getrennt
              </p>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
                aria-label="CSV-Datei auswaehlen"
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STEP 2: Preview & Confirm */}
      {/* ----------------------------------------------------------------- */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Vorschau</CardTitle>
              <CardDescription>
                Bitte ueberprüfe die erkannten Daten vor dem Import.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Card className="flex-1 min-w-[140px]">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{devices.length}</p>
                    <p className="text-sm text-muted-foreground">Geraete erkannt</p>
                  </CardContent>
                </Card>
                <Card className="flex-1 min-w-[140px]">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{totalLoans}</p>
                    <p className="text-sm text-muted-foreground">Ausleihvorgaenge erkannt</p>
                  </CardContent>
                </Card>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <Alert>
                  <AlertTitle>Hinweise ({warnings.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      {warnings.slice(0, 10).map((w, i) => (
                        <li key={i}>
                          <span className="font-medium">Zeile {w.row}:</span> {w.message}
                        </li>
                      ))}
                      {warnings.length > 10 && (
                        <li className="text-muted-foreground">
                          ... und {warnings.length - 10} weitere
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Preview table (first 5 rows) */}
          <Card>
            <CardHeader>
              <CardTitle>Vorschau (erste 5 Geraete)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HIBBNo</TableHead>
                      <TableHead>Seriennummer</TableHead>
                      <TableHead className="text-right">Anzahl Ausleihen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Keine Geraete erkannt
                        </TableCell>
                      </TableRow>
                    ) : (
                      devices.slice(0, 5).map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>{d.serial_number}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{d.loanCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {devices.length > 5 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  ... und {devices.length - 5} weitere Geraete
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1)
                setDevices([])
                setWarnings([])
                setError(null)
              }}
              disabled={importing}
            >
              Zurueck
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importiere..." : "Import starten"}
            </Button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STEP 3: Result */}
      {/* ----------------------------------------------------------------- */}
      {step === 3 && result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {result.errors.length === 0
                  ? "Import erfolgreich"
                  : "Import abgeschlossen (mit Fehlern)"}
              </CardTitle>
              <CardDescription>
                {result.imported_devices === 0 && result.skipped_duplicates > 0
                  ? "Keine neuen Geraete importiert. Alle Geraete waren bereits vorhanden."
                  : "Zusammenfassung des Imports."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{result.imported_devices}</p>
                  <p className="text-sm text-muted-foreground">Importierte Geraete</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{result.imported_loans}</p>
                  <p className="text-sm text-muted-foreground">Importierte Ausleihen</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{result.skipped_duplicates}</p>
                  <p className="text-sm text-muted-foreground">Uebersprungene Duplikate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {result.errors.length > 0 && (
            <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen}>
              <Alert variant="destructive">
                <AlertTitle className="flex items-center justify-between">
                  <span>Fehler ({result.errors.length})</span>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {errorsOpen ? "Ausblenden" : "Anzeigen"}
                    </Button>
                  </CollapsibleTrigger>
                </AlertTitle>
                <CollapsibleContent>
                  <AlertDescription>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      {result.errors.map((err, i) => (
                        <li key={i}>
                          <span className="font-medium">Zeile {err.row}:</span> {err.reason}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </CollapsibleContent>
              </Alert>
            </Collapsible>
          )}

          <Button asChild>
            <Link href="/">Zur Geraételiste</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
