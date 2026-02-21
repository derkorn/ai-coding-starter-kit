"use client"

import { useState } from "react"
import Link from "next/link"
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
import { EditDeviceDialog } from "@/components/devices/edit-device-dialog"
import { DeleteDeviceDialog } from "@/components/devices/delete-device-dialog"
import { CreateLoanDialog } from "@/components/loans/create-loan-dialog"
import { ReturnLoanDialog } from "@/components/loans/return-loan-dialog"
import type { DeviceWithStatus } from "@/lib/database.types"
import { Pencil, Trash2 } from "lucide-react"

interface DeviceTableProps {
  devices: DeviceWithStatus[]
}

type DialogState =
  | { type: "none" }
  | { type: "edit"; device: DeviceWithStatus }
  | { type: "delete"; device: DeviceWithStatus }
  | { type: "loan"; device: DeviceWithStatus }
  | { type: "return"; device: DeviceWithStatus }

export function DeviceTable({ devices }: DeviceTableProps) {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" })

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16">
        <p className="text-muted-foreground">Noch keine Geräte vorhanden.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Legen Sie ein neues Gerät an, um zu beginnen.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seriennummer</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ausleiher</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm">
                  <Link
                    href={`/devices/${device.id}`}
                    className="hover:underline"
                  >
                    {device.serial_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/devices/${device.id}`}
                    className="font-medium hover:underline"
                  >
                    {device.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {device.isLoaned ? (
                    <Badge className="border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100">
                      Ausgeliehen
                    </Badge>
                  ) : (
                    <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Verfügbar
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {device.activeLoan ? (
                    <span className="text-sm">
                      {device.activeLoan.borrower_first_name}{" "}
                      {device.activeLoan.borrower_last_name},{" "}
                      <span className="text-muted-foreground">
                        {device.activeLoan.borrower_class}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {device.isLoaned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDialog({ type: "return", device })
                        }
                      >
                        Zurücknehmen
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDialog({ type: "loan", device })
                        }
                      >
                        Ausleihen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setDialog({ type: "edit", device })
                      }
                      aria-label={`${device.name} bearbeiten`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setDialog({ type: "delete", device })
                      }
                      disabled={device.isLoaned}
                      aria-label={`${device.name} löschen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {dialog.type === "edit" && (
        <EditDeviceDialog
          deviceId={dialog.device.id}
          serialNumber={dialog.device.serial_number}
          currentName={dialog.device.name}
          open
          onOpenChange={(open) => {
            if (!open) setDialog({ type: "none" })
          }}
        />
      )}

      {dialog.type === "delete" && (
        <DeleteDeviceDialog
          deviceId={dialog.device.id}
          deviceName={dialog.device.name}
          open
          onOpenChange={(open) => {
            if (!open) setDialog({ type: "none" })
          }}
        />
      )}

      {dialog.type === "loan" && (
        <CreateLoanDialog
          deviceId={dialog.device.id}
          deviceName={dialog.device.name}
          open
          onOpenChange={(open) => {
            if (!open) setDialog({ type: "none" })
          }}
        />
      )}

      {dialog.type === "return" && dialog.device.activeLoan && (
        <ReturnLoanDialog
          loanId={dialog.device.activeLoan.id}
          deviceName={dialog.device.name}
          borrowerName={`${dialog.device.activeLoan.borrower_first_name} ${dialog.device.activeLoan.borrower_last_name}`}
          borrowerClass={dialog.device.activeLoan.borrower_class}
          loanedAt={dialog.device.activeLoan.loaned_at}
          open
          onOpenChange={(open) => {
            if (!open) setDialog({ type: "none" })
          }}
        />
      )}
    </>
  )
}
