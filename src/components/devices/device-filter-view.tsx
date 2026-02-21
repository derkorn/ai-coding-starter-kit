"use client"

import { useCallback, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { DeviceTable } from "@/components/devices/device-table"
import type { DeviceWithStatus } from "@/lib/database.types"

interface DeviceFilterViewProps {
  devices: DeviceWithStatus[]
}

type StatusFilter = "all" | "available" | "loaned"

export function DeviceFilterView({ devices }: DeviceFilterViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get("q") ?? ""
  const status = (searchParams.get("status") ?? "all") as StatusFilter
  const selectedClass = searchParams.get("class") ?? ""

  // Collect unique classes from active loans
  const availableClasses = useMemo(() => {
    const classes = new Set<string>()
    for (const device of devices) {
      if (device.activeLoan?.borrower_class) {
        classes.add(device.activeLoan.borrower_class)
      }
    }
    return [...classes].sort()
  }, [devices])

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const resetAll = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  // Filter logic (AND combination)
  const filtered = useMemo(() => {
    const lowerQ = q.toLowerCase()
    return devices.filter((device) => {
      // Text search
      if (lowerQ) {
        const matchesDevice =
          device.serial_number.toLowerCase().includes(lowerQ) ||
          device.name.toLowerCase().includes(lowerQ)
        const matchesBorrower = device.activeLoan
          ? device.activeLoan.borrower_first_name.toLowerCase().includes(lowerQ) ||
            device.activeLoan.borrower_last_name.toLowerCase().includes(lowerQ)
          : false
        if (!matchesDevice && !matchesBorrower) return false
      }

      // Status filter
      if (status === "available" && device.isLoaned) return false
      if (status === "loaned" && !device.isLoaned) return false

      // Class filter
      if (selectedClass) {
        if (!device.activeLoan || device.activeLoan.borrower_class !== selectedClass) {
          return false
        }
      }

      return true
    })
  }, [devices, q, status, selectedClass])

  const hasActiveFilters = q !== "" || status !== "all" || selectedClass !== ""
  const statusLabels: Record<StatusFilter, string> = {
    all: "Alle",
    available: "Verfügbar",
    loaned: "Ausgeliehen",
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Text search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suche nach Gerät, Seriennummer oder Ausleiher..."
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            className="pl-9"
            aria-label="Geräte durchsuchen"
          />
        </div>

        {/* Status filter */}
        <div className="flex rounded-md border bg-background p-0.5" role="group" aria-label="Status-Filter">
          {(["all", "available", "loaned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setParam("status", s === "all" ? "" : s)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                status === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={status === s}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {/* Class filter */}
        {availableClasses.length > 0 && (
          <Select
            value={selectedClass || "__all__"}
            onValueChange={(v) => setParam("class", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-[140px]" aria-label="Klasse filtern">
              <SelectValue placeholder="Klasse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle Klassen</SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Aktive Filter:</span>
          {q && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Suche: &ldquo;{q}&rdquo;
              <button
                onClick={() => setParam("q", "")}
                className="ml-0.5 rounded-full hover:bg-muted"
                aria-label="Suchfilter entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {status !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {statusLabels[status]}
              <button
                onClick={() => setParam("status", "")}
                className="ml-0.5 rounded-full hover:bg-muted"
                aria-label="Statusfilter entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedClass && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Klasse: {selectedClass}
              <button
                onClick={() => setParam("class", "")}
                className="ml-0.5 rounded-full hover:bg-muted"
                aria-label="Klassenfilter entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Alle zurücksetzen
          </Button>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 && devices.length > 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16 text-center">
          <p className="font-medium">Keine Geräte gefunden</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keine Geräte entsprechen den aktiven Filtern.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={resetAll}>
            Filter zurücksetzen
          </Button>
        </div>
      ) : (
        <DeviceTable devices={filtered} />
      )}
    </div>
  )
}
