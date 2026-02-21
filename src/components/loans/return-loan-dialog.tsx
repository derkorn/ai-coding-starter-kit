"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { returnLoan } from "@/lib/actions/loans"

interface ReturnLoanDialogProps {
  loanId: string
  deviceName: string
  borrowerName: string
  borrowerClass: string
  loanedAt: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function todayString() {
  return new Date().toISOString().split("T")[0]
}

export function ReturnLoanDialog({
  loanId,
  deviceName,
  borrowerName,
  borrowerClass,
  loanedAt,
  open,
  onOpenChange,
}: ReturnLoanDialogProps) {
  const [returnedAt, setReturnedAt] = useState(todayString)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!returnedAt) {
      toast.error("Bitte Rückgabedatum angeben")
      return
    }

    startTransition(async () => {
      const result = await returnLoan({
        loan_id: loanId,
        returned_at: returnedAt,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Rückgabe erfolgreich erfasst")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (value) setReturnedAt(todayString())
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rückgabe erfassen</DialogTitle>
            <DialogDescription>
              Bestätigen Sie die Rückgabe des Geräts.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Gerät:</span>
                <span className="font-medium">{deviceName}</span>
                <span className="text-muted-foreground">Ausleiher:</span>
                <span className="font-medium">
                  {borrowerName}, {borrowerClass}
                </span>
                <span className="text-muted-foreground">Ausgabe:</span>
                <span className="font-medium">
                  {new Date(loanedAt).toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_date">Rückgabedatum</Label>
              <Input
                id="return_date"
                type="date"
                value={returnedAt}
                onChange={(e) => setReturnedAt(e.target.value)}
                min={loanedAt}
                disabled={isPending}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird erfasst..." : "Rückgabe bestätigen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
