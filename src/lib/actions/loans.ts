'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { createLoanSchema, returnLoanSchema } from '@/lib/validations'
import type { CreateLoanInput, ReturnLoanInput } from '@/lib/validations'

export async function createLoan(input: CreateLoanInput) {
  const parsed = createLoanSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data: activeLoan } = await supabase
    .from('loans')
    .select('id')
    .eq('device_id', parsed.data.device_id)
    .is('returned_at', null)
    .maybeSingle()

  if (activeLoan) {
    return { error: 'Gerät ist bereits ausgeliehen' }
  }

  const { data, error } = await supabase
    .from('loans')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return { error: 'Fehler beim Erfassen der Ausleihe' }
  }

  revalidatePath('/')
  revalidatePath('/loans')
  revalidatePath(`/devices/${parsed.data.device_id}`)
  return { data }
}

export async function returnLoan(input: ReturnLoanInput) {
  const parsed = returnLoanSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data: loan } = await supabase
    .from('loans')
    .select('loaned_at, device_id')
    .eq('id', parsed.data.loan_id)
    .single()

  if (!loan) {
    return { error: 'Ausleihe nicht gefunden' }
  }

  if (parsed.data.returned_at < loan.loaned_at) {
    return { error: 'Rückgabedatum darf nicht vor dem Ausgabedatum liegen' }
  }

  const { data, error } = await supabase
    .from('loans')
    .update({ returned_at: parsed.data.returned_at })
    .eq('id', parsed.data.loan_id)
    .select()
    .single()

  if (error) {
    return { error: 'Fehler beim Erfassen der Rückgabe' }
  }

  revalidatePath('/')
  revalidatePath('/loans')
  revalidatePath(`/devices/${loan.device_id}`)
  return { data }
}
