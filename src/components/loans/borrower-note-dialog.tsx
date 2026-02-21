"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { upsertBorrowerNote, deleteBorrowerNote } from "@/lib/actions/borrower-notes"
import type { BorrowerNote } from "@/lib/database.types"

const MAX_NOTE_LENGTH = 500

interface BorrowerNoteDialogProps {
  borrowerFirstName: string
  borrowerLastName: string
  borrowerClass: string
  existingNote: BorrowerNote | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BorrowerNoteDialog({
  borrowerFirstName,
  borrowerLastName,
  borrowerClass,
  existingNote,
  open,
  onOpenChange,
}: BorrowerNoteDialogProps) {
  const [noteText, setNoteText] = useState(existingNote?.note_text ?? "")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleOpenChange(value: boolean) {
    if (!value) {
      setNoteText(existingNote?.note_text ?? "")
      setShowDeleteConfirm(false)
    }
    onOpenChange(value)
  }

  function handleSave() {
    const trimmed = noteText.trim()
    if (!trimmed) {
      toast.error("Notiz darf nicht leer sein")
      return
    }
    if (trimmed.length > MAX_NOTE_LENGTH) {
      toast.error(`Notiz darf max. ${MAX_NOTE_LENGTH} Zeichen haben`)
      return
    }

    startTransition(async () => {
      const result = await upsertBorrowerNote({
        last_name: borrowerLastName,
        first_name: borrowerFirstName,
        class: borrowerClass,
        note_text: trimmed,
      })

      if (!result.success) {
        toast.error(result.error ?? "Fehler beim Speichern")
        return
      }

      toast.success("Notiz gespeichert")
      onOpenChange(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!existingNote) return

    startTransition(async () => {
      const result = await deleteBorrowerNote({ id: existingNote.id })

      if (!result.success) {
        toast.error(result.error ?? "Fehler beim L\u00f6schen")
        return
      }

      toast.success("Notiz gel\u00f6scht")
      setShowDeleteConfirm(false)
      onOpenChange(false)
      router.refresh()
    })
  }

  const charCount = noteText.length
  const isOverLimit = charCount > MAX_NOTE_LENGTH

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Notiz {existingNote ? "bearbeiten" : "hinzuf\u00fcgen"}
            </DialogTitle>
            <DialogDescription>
              {borrowerFirstName} {borrowerLastName}, {borrowerClass}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="borrower_note_text">Notiz</Label>
              <Textarea
                id="borrower_note_text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="z.B. Stift mitgegeben, iPad-H\u00fclle fehlt..."
                maxLength={MAX_NOTE_LENGTH + 10}
                rows={4}
                disabled={isPending}
                className={isOverLimit ? "border-destructive" : ""}
                aria-label="Notiztext"
              />
              <p
                className={`text-xs ${
                  isOverLimit
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {charCount} / {MAX_NOTE_LENGTH} Zeichen
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            {existingNote && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="mr-auto"
              >
                L\u00f6schen
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !noteText.trim() || isOverLimit}
            >
              {isPending ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notiz l\u00f6schen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Notiz f\u00fcr {borrowerFirstName} {borrowerLastName} wird unwiderruflich
              gel\u00f6scht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Wird gel\u00f6scht..." : "L\u00f6schen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
