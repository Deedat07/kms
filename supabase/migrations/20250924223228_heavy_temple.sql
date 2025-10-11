/*
  # Add QR Code column to users table

  1. Changes
    - Add `qr_code` column to `users` table
    - Set it as required (NOT NULL)
    - Add index for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add qr_code column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'qr_code'
  ) THEN
    ALTER TABLE users ADD COLUMN qr_code text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add index for qr_code for better performance
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON users (qr_code);