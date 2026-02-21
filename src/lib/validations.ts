import { z } from 'zod'

export const createDeviceSchema = z.object({
  serial_number: z
    .string()
    .min(1, 'Seriennummer ist erforderlich')
    .max(50, 'Seriennummer darf max. 50 Zeichen haben'),
  name: z
    .string()
    .min(1, 'Bezeichnung ist erforderlich')
    .max(100, 'Bezeichnung darf max. 100 Zeichen haben'),
})

export const updateDeviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Bezeichnung ist erforderlich')
    .max(100, 'Bezeichnung darf max. 100 Zeichen haben'),
})

export const createLoanSchema = z.object({
  device_id: z.string().uuid('Ungültige Geräte-ID'),
  borrower_first_name: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname darf max. 100 Zeichen haben'),
  borrower_last_name: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname darf max. 100 Zeichen haben'),
  borrower_class: z
    .string()
    .min(1, 'Klasse ist erforderlich')
    .max(20, 'Klasse darf max. 20 Zeichen haben'),
  loaned_at: z.string().min(1, 'Ausgabedatum ist erforderlich'),
})

export const returnLoanSchema = z.object({
  loan_id: z.string().uuid('Ungültige Ausleihe-ID'),
  returned_at: z.string().min(1, 'Rückgabedatum ist erforderlich'),
})

export const upsertBorrowerNoteSchema = z.object({
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  class: z.string().min(1, 'Klasse ist erforderlich').max(20),
  note_text: z
    .string()
    .min(1, 'Notiz darf nicht leer sein')
    .max(500, 'Notiz darf max. 500 Zeichen haben'),
})

export const deleteBorrowerNoteSchema = z.object({
  id: z.string().uuid('Ungültige Notiz-ID'),
})

export const lookupBorrowerNoteSchema = z.object({
  last_name: z.string().min(1).max(100),
  first_name: z.string().min(1).max(100),
  class: z.string().min(1).max(20),
})

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>
export type CreateLoanInput = z.infer<typeof createLoanSchema>
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>
export type UpsertBorrowerNoteInput = z.infer<typeof upsertBorrowerNoteSchema>
export type LookupBorrowerNoteInput = z.infer<typeof lookupBorrowerNoteSchema>
