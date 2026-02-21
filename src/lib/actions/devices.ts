'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { createDeviceSchema, updateDeviceSchema } from '@/lib/validations'
import type { CreateDeviceInput, UpdateDeviceInput } from '@/lib/validations'

export async function createDevice(input: CreateDeviceInput) {
  const parsed = createDeviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('devices')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Seriennummer bereits vorhanden' }
    }
    return { error: 'Fehler beim Anlegen des Geräts' }
  }

  revalidatePath('/')
  return { data }
}

export async function updateDevice(id: string, input: UpdateDeviceInput) {
  const parsed = updateDeviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('devices')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: 'Fehler beim Aktualisieren des Geräts' }
  }

  revalidatePath('/')
  revalidatePath(`/devices/${id}`)
  return { data }
}

export async function deleteDevice(id: string) {
  const { data: activeLoan } = await supabase
    .from('loans')
    .select('id')
    .eq('device_id', id)
    .is('returned_at', null)
    .maybeSingle()

  if (activeLoan) {
    return { error: 'Gerät kann nicht gelöscht werden: aktive Ausleihe vorhanden' }
  }

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: 'Fehler beim Löschen des Geräts' }
  }

  revalidatePath('/')
  return { success: true }
}
