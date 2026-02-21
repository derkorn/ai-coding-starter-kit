"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReturnLoanDialog } from "@/components/loans/return-loan-dialog"
import type { ActiveLoanWithDevice } from "@/lib/database.types"

interface ActiveLoansTableProps {
  loans: ActiveLoanWithDevice[]
}

function daysSince(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function ActiveLoansTable({ loans }: ActiveLoansTableProps) {
  const [returnLoan, setReturnLoan] = useState<ActiveLoanWithDevice | null>(
    null
  )

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gerät</TableHead>
              <TableHead>Ausleiher</TableHead>
              <TableHead>Ausgabedatum</TableHead>
              <TableHead>Tage ausgeliehen</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => {
              const days = daysSince(loan.loaned_at)
              return (
                <TableRow key={loan.id}>
                  <TableCell>
                    <Link
                      href={`/devices/${loan.devices.id}`}
                      className="font-medium hover:underline"
                    >
                      {loan.devices.name}
                    </Link>
                    <div className="font-mono text-xs text-muted-foreground">
                      {loan.devices.serial_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>
                      {loan.borrower_first_name} {loan.borrower_last_name}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      {loan.borrower_class}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(loan.loaned_at).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        days > 30
                          ? "font-medium text-orange-600"
                          : "text-foreground"
                      }
                    >
                      {days}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReturnLoan(loan)}
                    >
                      Zurücknehmen
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {returnLoan && (
        <ReturnLoanDialog
          loanId={returnLoan.id}
          deviceName={returnLoan.devices.name}
          borrowerName={`${returnLoan.borrower_first_name} ${returnLoan.borrower_last_name}`}
          borrowerClass={returnLoan.borrower_class}
          loanedAt={returnLoan.loaned_at}
          open
          onOpenChange={(open) => {
            if (!open) setReturnLoan(null)
          }}
        />
      )}
    </>
  )
}
