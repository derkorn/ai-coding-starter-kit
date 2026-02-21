"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StickyNote, Plus } from "lucide-react"
import { BorrowerNoteDialog } from "@/components/loans/borrower-note-dialog"
import type { Loan, BorrowerNote } from "@/lib/database.types"

interface LoanHistoryTableProps {
  loans: Loan[]
  notesMap: Record<string, BorrowerNote>
}

function daysBetween(start: string, end: string | null): number {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  const diff = endDate.getTime() - startDate.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function noteKey(lastName: string, firstName: string, cls: string): string {
  return `${lastName.toLowerCase()}|${firstName.toLowerCase()}|${cls.toLowerCase()}`
}

export function LoanHistoryTable({ loans, notesMap }: LoanHistoryTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)

  function openNoteDialog(loan: Loan) {
    setSelectedLoan(loan)
    setDialogOpen(true)
  }

  const selectedNote = selectedLoan
    ? notesMap[
        noteKey(
          selectedLoan.borrower_last_name,
          selectedLoan.borrower_first_name,
          selectedLoan.borrower_class
        )
      ] ?? null
    : null

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Klasse</TableHead>
              <TableHead>Ausgabe</TableHead>
              <TableHead>R&uuml;ckgabe</TableHead>
              <TableHead>Dauer (Tage)</TableHead>
              <TableHead className="w-[100px]">Notiz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => {
              const key = noteKey(
                loan.borrower_last_name,
                loan.borrower_first_name,
                loan.borrower_class
              )
              const note = notesMap[key] ?? null

              return (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">
                    {loan.borrower_first_name} {loan.borrower_last_name}
                  </TableCell>
                  <TableCell>{loan.borrower_class}</TableCell>
                  <TableCell>
                    {new Date(loan.loaned_at).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell>
                    {loan.returned_at ? (
                      new Date(loan.returned_at).toLocaleDateString("de-DE")
                    ) : (
                      <Badge className="border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100">
                        Aktiv
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {daysBetween(loan.loaned_at, loan.returned_at)}
                  </TableCell>
                  <TableCell>
                    {note ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-amber-600 hover:text-amber-700"
                            onClick={() => openNoteDialog(loan)}
                            aria-label={`Notiz f\u00fcr ${loan.borrower_first_name} ${loan.borrower_last_name} anzeigen`}
                          >
                            <StickyNote className="h-4 w-4" />
                            <span className="max-w-[60px] truncate text-xs">
                              {note.note_text}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-sm">{note.note_text}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => openNoteDialog(loan)}
                        aria-label={`Notiz f\u00fcr ${loan.borrower_first_name} ${loan.borrower_last_name} hinzuf\u00fcgen`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="text-xs">Notiz</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {selectedLoan && (
        <BorrowerNoteDialog
          borrowerFirstName={selectedLoan.borrower_first_name}
          borrowerLastName={selectedLoan.borrower_last_name}
          borrowerClass={selectedLoan.borrower_class}
          existingNote={selectedNote}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </TooltipProvider>
  )
}
