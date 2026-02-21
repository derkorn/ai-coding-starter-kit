"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteDevice } from "@/lib/actions/devices"

interface DeleteDeviceDialogProps {
  deviceId: string
  deviceName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDeviceDialog({
  deviceId,
  deviceName,
  open,
  onOpenChange,
}: DeleteDeviceDialogProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDevice(deviceId)

      if ("error" in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Gerät erfolgreich gelöscht")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerät löschen</DialogTitle>
          <DialogDescription>
            Möchten Sie das Gerät &ldquo;{deviceName}&rdquo; wirklich löschen?
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Wird gelöscht..." : "Löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
