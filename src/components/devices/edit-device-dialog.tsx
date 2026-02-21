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
import { updateDevice } from "@/lib/actions/devices"

interface EditDeviceDialogProps {
  deviceId: string
  serialNumber: string
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDeviceDialog({
  deviceId,
  serialNumber,
  currentName,
  open,
  onOpenChange,
}: EditDeviceDialogProps) {
  const [name, setName] = useState(currentName)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Bezeichnung ist erforderlich")
      return
    }

    startTransition(async () => {
      const result = await updateDevice(deviceId, { name: name.trim() })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Gerät erfolgreich aktualisiert")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gerät bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Bezeichnung des Geräts.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Seriennummer</Label>
              <Input value={serialNumber} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_name">Bezeichnung</Label>
              <Input
                id="edit_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              {isPending ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
