import { notFound } from "next/navigation"
import Link from "next/link"
import { getDeviceWithLoans } from "@/lib/actions/queries"
import { getBorrowerNotesForLoans } from "@/lib/actions/borrower-notes"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { DeviceDetailActions } from "./device-detail-actions"
import { LoanHistoryTable } from "./loan-history-table"
import type { BorrowerNote } from "@/lib/database.types"

interface DeviceDetailPageProps {
  params: Promise<{ id: string }>
}

function daysBetween(start: string, end: string | null): number {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  const diff = endDate.getTime() - startDate.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default async function DeviceDetailPage({
  params,
}: DeviceDetailPageProps) {
  const { id } = await params
  const device = await getDeviceWithLoans(id)

  if (!device) {
    notFound()
  }

  // Batch-load borrower notes for all loans on this device
  const borrowers = device.loans.map((loan) => ({
    last_name: loan.borrower_last_name,
    first_name: loan.borrower_first_name,
    class: loan.borrower_class,
  }))
  const notesMapRaw = await getBorrowerNotesForLoans(borrowers)

  // Convert Map to plain object for client component serialization
  const notesMap: Record<string, BorrowerNote> = {}
  for (const [key, note] of notesMapRaw) {
    notesMap[key] = note
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Alle Geräte
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {device.serial_number}
          </p>
          <div className="mt-3">
            {device.isLoaned ? (
              <Badge className="border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100">
                Ausgeliehen
              </Badge>
            ) : (
              <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Verfügbar
              </Badge>
            )}
          </div>
        </div>
      </div>

      {device.activeLoan && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Aktive Ausleihe</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Ausleiher: </span>
                    <span className="font-medium">
                      {device.activeLoan.borrower_first_name}{" "}
                      {device.activeLoan.borrower_last_name},{" "}
                      {device.activeLoan.borrower_class}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ausgabe: </span>
                    <span className="font-medium">
                      {new Date(
                        device.activeLoan.loaned_at
                      ).toLocaleDateString("de-DE")}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Dauer: </span>
                    <span className="font-medium">
                      {daysBetween(device.activeLoan.loaned_at, null)} Tage
                    </span>
                  </p>
                </div>
              </div>
              <DeviceDetailActions
                activeLoan={device.activeLoan}
                deviceName={device.name}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Ausleihhistorie</h2>
        {device.loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12">
            <p className="text-muted-foreground">
              Keine Ausleihen für dieses Gerät.
            </p>
          </div>
        ) : (
          <LoanHistoryTable loans={device.loans} notesMap={notesMap} />
        )}
      </div>
    </div>
  )
}
