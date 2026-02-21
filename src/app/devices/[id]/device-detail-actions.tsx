"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ReturnLoanDialog } from "@/components/loans/return-loan-dialog"
import type { Loan } from "@/lib/database.types"

interface DeviceDetailActionsProps {
  activeLoan: Loan
  deviceName: string
}

export function DeviceDetailActions({
  activeLoan,
  deviceName,
}: DeviceDetailActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Rückgabe erfassen
      </Button>
      <ReturnLoanDialog
        loanId={activeLoan.id}
        deviceName={deviceName}
        borrowerName={`${activeLoan.borrower_first_name} ${activeLoan.borrower_last_name}`}
        borrowerClass={activeLoan.borrower_class}
        loanedAt={activeLoan.loaned_at}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
