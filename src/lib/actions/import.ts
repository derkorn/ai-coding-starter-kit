'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export interface ImportLoan {
  borrower_last_name: string
  borrower_first_name: string
  borrower_class: string
  loaned_at: string
  returned_at: string | null
}

export interface ImportRow {
  device: {
    serial_number: string
    name: string
  }
  loans: ImportLoan[]
}

export interface ImportResult {
  imported_devices: number
  imported_loans: number
  skipped_duplicates: number
  errors: Array<{ row: number; reason: string }>
}

export async function bulkImportDevices(rows: ImportRow[]): Promise<ImportResult> {
  let imported_devices = 0
  let imported_loans = 0
  let skipped_duplicates = 0
  const errors: Array<{ row: number; reason: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 1

    if (!row.device.serial_number) {
      errors.push({ row: rowIndex, reason: 'Seriennummer fehlt' })
      continue
    }

    let deviceId: string | null = null

    // Try to insert the device
    const { data: insertedDevice, error: insertError } = await supabase
      .from('devices')
      .insert({
        serial_number: row.device.serial_number,
        name: row.device.name || row.device.serial_number,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate serial_number - look up existing device
        skipped_duplicates++
        const { data: existingDevice } = await supabase
          .from('devices')
          .select('id')
          .eq('serial_number', row.device.serial_number)
          .single()

        if (existingDevice) {
          deviceId = existingDevice.id
        } else {
          errors.push({
            row: rowIndex,
            reason: `Gerät mit Seriennummer ${row.device.serial_number} konnte nicht gefunden werden`,
          })
          continue
        }
      } else {
        errors.push({
          row: rowIndex,
          reason: `Fehler beim Anlegen: ${insertError.message}`,
        })
        continue
      }
    } else {
      deviceId = insertedDevice.id
      imported_devices++
    }

    // Import loans for this device
    if (deviceId && row.loans.length > 0) {
      const loansToInsert = row.loans.map((loan) => ({
        device_id: deviceId as string,
        borrower_last_name: loan.borrower_last_name,
        borrower_first_name: loan.borrower_first_name,
        borrower_class: loan.borrower_class,
        loaned_at: loan.loaned_at,
        returned_at: loan.returned_at,
      }))

      const { data: insertedLoans, error: loanError } = await supabase
        .from('loans')
        .insert(loansToInsert)
        .select('id')

      if (loanError) {
        errors.push({
          row: rowIndex,
          reason: `Ausleihen konnten nicht importiert werden: ${loanError.message}`,
        })
      } else {
        imported_loans += insertedLoans?.length ?? 0
      }
    }
  }

  revalidatePath('/')
  revalidatePath('/loans')

  return {
    imported_devices,
    imported_loans,
    skipped_duplicates,
    errors,
  }
}
