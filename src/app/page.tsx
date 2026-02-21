import { Suspense } from "react"
import { getDevicesWithStatus, getDeviceStats } from "@/lib/actions/queries"
import { StatsCards } from "@/components/stats-cards"
import { DeviceFilterView } from "@/components/devices/device-filter-view"
import { CreateDeviceDialog } from "@/components/devices/create-device-dialog"

export default async function HomePage() {
  const [devices, stats] = await Promise.all([
    getDevicesWithStatus(),
    getDeviceStats(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Geräte</h1>
        <p className="mt-1 text-muted-foreground">
          Übersicht aller verwalteten Geräte.
        </p>
      </div>

      <StatsCards
        total={stats.total}
        available={stats.available}
        loaned={stats.loaned}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Geräteliste</h2>
        <CreateDeviceDialog />
      </div>

      <Suspense fallback={null}>
        <DeviceFilterView devices={devices} />
      </Suspense>
    </div>
  )
}
