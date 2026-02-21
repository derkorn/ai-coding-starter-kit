import { getActiveLoans } from "@/lib/actions/queries"
import { Badge } from "@/components/ui/badge"
import { ActiveLoansTable } from "./active-loans-table"

export default async function LoansPage() {
  const loans = await getActiveLoans()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Aktive Ausleihen</h1>
        <Badge variant="secondary" className="text-sm">
          {loans.length}
        </Badge>
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16">
          <p className="text-muted-foreground">
            Alle Geräte sind verfügbar.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Es gibt derzeit keine aktiven Ausleihen.
          </p>
        </div>
      ) : (
        <ActiveLoansTable loans={loans} />
      )}
    </div>
  )
}
