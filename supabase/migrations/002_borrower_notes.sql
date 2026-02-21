-- PROJ-7: Ausleiher-Notizen
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS borrower_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  class TEXT NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique constraint: one note per person (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_borrower_notes_person
  ON borrower_notes (lower(last_name), lower(first_name), lower(class));

-- Index to support lookups by last_name (used in loan dialog warning)
CREATE INDEX IF NOT EXISTS idx_borrower_notes_last_name
  ON borrower_notes (lower(last_name));

-- Enable Row Level Security
ALTER TABLE borrower_notes ENABLE ROW LEVEL SECURITY;

-- Permissive policy for anon role (single-user app, no authentication required)
CREATE POLICY "Allow all for anon" ON borrower_notes
  FOR ALL TO anon USING (true) WITH CHECK (true);
