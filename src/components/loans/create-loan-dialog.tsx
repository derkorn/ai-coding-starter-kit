"use client"

import { useState, useTransition, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { createLoan } from "@/lib/actions/loans"
import { lookupBorrowerNote } from "@/lib/actions/borrower-notes"
import type { BorrowerNote } from "@/lib/database.types"

interface CreateLoanDialogProps {
  deviceId: string
  deviceName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function todayString() {
  return new Date().toISOString().split("T")[0]
}

export function CreateLoanDialog({
  deviceId,
  deviceName,
  open,
  onOpenChange,
}: CreateLoanDialogProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [borrowerClass, setBorrowerClass] = useState("")
  const [loanedAt, setLoanedAt] = useState(todayString)
  const [isPending, startTransition] = useTransition()
  const [borrowerNote, setBorrowerNote] = useState<BorrowerNote | null>(null)
  const [isLookingUpNote, setIsLookingUpNote] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const lookupNote = useCallback(
    (fn: string, ln: string, cls: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      const trimFn = fn.trim()
      const trimLn = ln.trim()
      const trimCls = cls.trim()

      if (!trimFn || !trimLn || !trimCls) {
        setBorrowerNote(null)
        return
      }

      debounceTimer.current = setTimeout(async () => {
        setIsLookingUpNote(true)
        try {
          const note = await lookupBorrowerNote({
            first_name: trimFn,
            last_name: trimLn,
            class: trimCls,
          })
          setBorrowerNote(note)
        } catch {
          setBorrowerNote(null)
        } finally {
          setIsLookingUpNote(false)
        }
      }, 400)
    },
    []
  )

  useEffect(() => {
    lookupNote(firstName, lastName, borrowerClass)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [firstName, lastName, borrowerClass, lookupNote])

  function resetForm() {
    setFirstName("")
    setLastName("")
    setBorrowerClass("")
    setLoanedAt(todayString())
    setBorrowerNote(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !borrowerClass.trim() ||
      !loanedAt
    ) {
      toast.error("Bitte alle Felder ausfüllen")
      return
    }

    startTransition(async () => {
      const result = await createLoan({
        device_id: deviceId,
        borrower_first_name: firstName.trim(),
        borrower_last_name: lastName.trim(),
        borrower_class: borrowerClass.trim(),
        loaned_at: loanedAt,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Ausleihe erfolgreich erfasst")
      onOpenChange(false)
      resetForm()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (!value) resetForm()
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gerät ausleihen</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Ausleihe für &ldquo;{deviceName}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_first_name">Vorname</Label>
                <Input
                  id="loan_first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Vorname"
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_last_name">Nachname</Label>
                <Input
                  id="loan_last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nachname"
                  disabled={isPending}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_class">Klasse</Label>
                <Input
                  id="loan_class"
                  value={borrowerClass}
                  onChange={(e) => setBorrowerClass(e.target.value)}
                  placeholder="z.B. 8a"
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_date">Ausgabedatum</Label>
                <Input
                  id="loan_date"
                  type="date"
                  value={loanedAt}
                  onChange={(e) => setLoanedAt(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            {borrowerNote && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertTriangle className="h-4 w-4 !text-amber-600" />
                <AlertTitle className="text-amber-800">
                  Hinweis zu {firstName.trim()} {lastName.trim()}
                </AlertTitle>
                <AlertDescription className="text-amber-700">
                  {borrowerNote.note_text}
                </AlertDescription>
              </Alert>
            )}
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
              {isPending ? "Wird erfasst..." : "Ausleihe erfassen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
