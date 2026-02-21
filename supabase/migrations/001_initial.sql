-- iPad Ausleihverwaltung – Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  borrower_first_name TEXT NOT NULL,
  borrower_last_name TEXT NOT NULL,
  borrower_class TEXT NOT NULL,
  loaned_at DATE NOT NULL,
  returned_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_loans_device_id ON loans(device_id);
CREATE INDEX IF NOT EXISTS idx_loans_returned_at ON loans(returned_at);
CREATE INDEX IF NOT EXISTS idx_loans_device_returned ON loans(device_id, returned_at);

-- Enable Row Level Security (best practice, even without auth)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon role (single-user app, no authentication required)
CREATE POLICY "Allow all for anon" ON devices
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON loans
  FOR ALL TO anon USING (true) WITH CHECK (true);
