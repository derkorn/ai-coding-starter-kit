'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import type { BorrowerNote } from '@/lib/database.types'
import {
  upsertBorrowerNoteSchema,
  deleteBorrowerNoteSchema,
  lookupBorrowerNoteSchema,
} from '@/lib/validations'

export async function upsertBorrowerNote(input: unknown): Promise<{
  success: boolean
  error?: string
  note?: BorrowerNote
}> {
  const parsed = upsertBorrowerNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }
  }

  const { last_name, first_name, class: cls, note_text } = parsed.data

  // Upsert: insert or update on conflict of (lower(last_name), lower(first_name), lower(class))
  // Supabase doesn't support expression indexes in onConflict directly,
  // so we do a manual lookup + insert/update.
  const { data: existing } = await supabase
    .from('borrower_notes')
    .select('id')
    .eq('last_name', last_name.toLowerCase())
    .eq('first_name', first_name.toLowerCase())
    .eq('class', cls.toLowerCase())
    .maybeSingle()

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('borrower_notes')
      .update({ note_text, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    result = data
  } else {
    const { data, error } = await supabase
      .from('borrower_notes')
      .insert({
        last_name: last_name.toLowerCase(),
        first_name: first_name.toLowerCase(),
        class: cls.toLowerCase(),
        note_text,
      })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    result = data
  }

  revalidatePath('/devices/[id]', 'page')
  return { success: true, note: result as BorrowerNote }
}

export async function deleteBorrowerNote(input: unknown): Promise<{
  success: boolean
  error?: string
}> {
  const parsed = deleteBorrowerNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Ungültige Notiz-ID' }
  }

  const { error } = await supabase
    .from('borrower_notes')
    .delete()
    .eq('id', parsed.data.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/devices/[id]', 'page')
  return { success: true }
}

export async function lookupBorrowerNote(input: unknown): Promise<BorrowerNote | null> {
  const parsed = lookupBorrowerNoteSchema.safeParse(input)
  if (!parsed.success) return null

  const { last_name, first_name, class: cls } = parsed.data

  const { data } = await supabase
    .from('borrower_notes')
    .select('*')
    .eq('last_name', last_name.toLowerCase())
    .eq('first_name', first_name.toLowerCase())
    .eq('class', cls.toLowerCase())
    .maybeSingle()

  return (data as BorrowerNote | null) ?? null
}

/**
 * Batch-load notes for a list of borrowers.
 * Returns a map keyed by "last_name|first_name|class" (all lowercase).
 */
export async function getBorrowerNotesForLoans(
  borrowers: Array<{ last_name: string; first_name: string; class: string }>
): Promise<Map<string, BorrowerNote>> {
  if (borrowers.length === 0) return new Map()

  // Collect unique lowercase last names to narrow the query
  const lastNames = [...new Set(borrowers.map((b) => b.last_name.toLowerCase()))]

  const { data } = await supabase
    .from('borrower_notes')
    .select('*')
    .in('last_name', lastNames)

  const map = new Map<string, BorrowerNote>()
  for (const note of data ?? []) {
    const key = `${note.last_name}|${note.first_name}|${note.class}`
    map.set(key, note as BorrowerNote)
  }
  return map
}

export async function borrowerNoteKey(last_name: string, first_name: string, cls: string): Promise<string> {
  return `${last_name.toLowerCase()}|${first_name.toLowerCase()}|${cls.toLowerCase()}`
}
