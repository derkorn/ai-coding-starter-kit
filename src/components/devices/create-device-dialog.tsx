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
  DialogTrigger,
} from "@/components/ui/dialog"
import { createDevice } from "@/lib/actions/devices"
import { Plus } from "lucide-react"

export function CreateDeviceDialog() {
  const [open, setOpen] = useState(false)
  const [serialNumber, setSerialNumber] = useState("")
  const [name, setName] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function resetForm() {
    setSerialNumber("")
    setName("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!serialNumber.trim() || !name.trim()) {
      toast.error("Bitte alle Felder ausfüllen")
      return
    }

    startTransition(async () => {
      const result = await createDevice({
        serial_number: serialNumber.trim(),
        name: name.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Gerät erfolgreich angelegt")
      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Neues Gerät
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neues Gerät anlegen</DialogTitle>
            <DialogDescription>
              Geben Sie die Daten des neuen Geräts ein.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Seriennummer</Label>
              <Input
                id="serial_number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="z.B. SN-2024-001"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device_name">Bezeichnung</Label>
              <Input
                id="device_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. iPad Air 5. Gen"
                disabled={isPending}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird angelegt..." : "Anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
