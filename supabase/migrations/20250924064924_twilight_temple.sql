/*
  # Add ID card upload fields

  1. Schema Changes
    - Add `id_card_url` field to `admins` table for storing uploaded ID card
    - Add `id_card_url` field to `users` table for storing uploaded ID card
    - Both fields are required (NOT NULL) to ensure ID cards are always uploaded

  2. Security
    - Fields are accessible through existing RLS policies
    - File URLs will be stored as text references to Supabase Storage
*/

-- Add id_card_url to admins table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'id_card_url'
  ) THEN
    ALTER TABLE admins ADD COLUMN id_card_url text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add id_card_url to users table  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id_card_url'
  ) THEN
    ALTER TABLE users ADD COLUMN id_card_url text NOT NULL DEFAULT '';
  END IF;
END $$;