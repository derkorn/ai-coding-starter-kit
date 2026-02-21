import { supabase } from '@/lib/supabase'
import type { DeviceWithStatus, DeviceWithLoans, ActiveLoanWithDevice, Loan, Device } from '@/lib/database.types'

export async function getDevicesWithStatus(): Promise<DeviceWithStatus[]> {
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('*')
    .order('name')

  if (devicesError || !devices) return []

  const { data: activeLoans } = await supabase
    .from('loans')
    .select('*')
    .is('returned_at', null)

  return devices.map(device => {
    const activeLoan = activeLoans?.find(l => l.device_id === device.id) ?? null
    return {
      ...device,
      activeLoan,
      isLoaned: !!activeLoan,
    }
  })
}

export async function getDeviceWithLoans(id: string): Promise<DeviceWithLoans | null> {
  const { data: device, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !device) return null

  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('device_id', id)
    .order('loaned_at', { ascending: false })

  const loansData = loans ?? []
  const activeLoan = loansData.find(l => l.returned_at === null) ?? null

  return {
    ...device,
    loans: loansData,
    activeLoan,
    isLoaned: !!activeLoan,
  }
}

export async function getActiveLoans(): Promise<ActiveLoanWithDevice[]> {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      devices (
        id,
        serial_number,
        name
      )
    `)
    .is('returned_at', null)
    .order('loaned_at', { ascending: true })

  if (error) return []
  return (data ?? []) as ActiveLoanWithDevice[]
}

export async function getDeviceStats() {
  const { data: devices } = await supabase
    .from('devices')
    .select('id')

  const { data: activeLoans } = await supabase
    .from('loans')
    .select('id')
    .is('returned_at', null)

  const total = devices?.length ?? 0
  const loaned = activeLoans?.length ?? 0
  const available = total - loaned

  return { total, loaned, available }
}

export async function getStatistics() {
  const { data: rawLoans } = await supabase
    .from('loans')
    .select('*, devices(id, name, serial_number)')
    .order('loaned_at', { ascending: false })

  type LoanWithDevice = Loan & {
    devices: Pick<Device, 'id' | 'name' | 'serial_number'>
  }

  const loans = (rawLoans ?? []) as LoanWithDevice[]
  const today = new Date()

  function daysBetween(start: string, end: string | null): number {
    const diff = (end ? new Date(end) : today).getTime() - new Date(start).getTime()
    return Math.max(0, Math.floor(diff / 86400000))
  }

  // Longest active loans (top 10, sorted by days desc)
  const longestActiveLoans = loans
    .filter((l) => l.returned_at === null)
    .map((l) => ({
      id: l.id,
      deviceId: l.devices.id,
      deviceName: l.devices.name,
      deviceSerial: l.devices.serial_number,
      borrowerFirstName: l.borrower_first_name,
      borrowerLastName: l.borrower_last_name,
      borrowerClass: l.borrower_class,
      loanedAt: l.loaned_at,
      daysLoaned: daysBetween(l.loaned_at, null),
    }))
    .sort((a, b) => b.daysLoaned - a.daysLoaned)
    .slice(0, 10)

  // Top borrowers: group by name+class (top 10 by count)
  const borrowerMap = new Map<string, {
    firstName: string; lastName: string; cls: string; count: number
  }>()
  for (const l of loans) {
    const key = `${l.borrower_last_name}|${l.borrower_first_name}|${l.borrower_class}`
    const entry = borrowerMap.get(key)
    if (entry) { entry.count++ } else {
      borrowerMap.set(key, {
        firstName: l.borrower_first_name,
        lastName: l.borrower_last_name,
        cls: l.borrower_class,
        count: 1,
      })
    }
  }
  const topBorrowers = [...borrowerMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Device utilization: group by device (top 10 by loan count)
  const deviceMap = new Map<string, {
    deviceId: string; name: string; serial: string
    loanCount: number; totalDays: number
  }>()
  for (const l of loans) {
    const days = daysBetween(l.loaned_at, l.returned_at)
    const entry = deviceMap.get(l.devices.id)
    if (entry) { entry.loanCount++; entry.totalDays += days } else {
      deviceMap.set(l.devices.id, {
        deviceId: l.devices.id,
        name: l.devices.name,
        serial: l.devices.serial_number,
        loanCount: 1,
        totalDays: days,
      })
    }
  }
  const deviceUtilization = [...deviceMap.values()]
    .map((d) => ({ ...d, avgDays: Math.round(d.totalDays / d.loanCount) }))
    .sort((a, b) => b.loanCount - a.loanCount)
    .slice(0, 10)

  return {
    totalLoans: loans.length,
    longestActiveLoans,
    topBorrowers,
    deviceUtilization,
  }
}
