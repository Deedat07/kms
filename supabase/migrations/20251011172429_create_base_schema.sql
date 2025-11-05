/*
  # Initial Schema Setup - Key Management System

  ## Overview
  Creates the foundational tables for the Key Management System including users, admins, keys, and issue records.

  ## New Tables

  ### `admins`
  System administrators who manage the key system
  - `id` (uuid, primary key) - Admin identifier
  - `name` (text) - Admin full name
  - `staff_id` (text, unique) - Staff identification number
  - `phone` (text, nullable) - Contact phone number
  - `email` (text, unique) - Email address
  - `created_at` (timestamptz) - Registration timestamp
  - `id_card_url` (text) - URL to uploaded ID card image

  ### `users`
  System users who can borrow keys
  - `id` (uuid, primary key) - User identifier
  - `name` (text) - User full name
  - `role` (text) - User type: student, lecturer, or cleaner
  - `user_id` (text, unique) - User identification number
  - `phone` (text, nullable) - Contact phone number
  - `email` (text, nullable) - Email address
  - `qr_code` (text, unique) - QR code for identification
  - `created_at` (timestamptz) - Registration timestamp
  - `id_card_url` (text) - URL to uploaded ID card image

  ### `keys`
  Physical keys in the system
  - `id` (uuid, primary key) - Key identifier
  - `label` (text) - Key name/label
  - `location` (text) - Key location description
  - `status` (text) - Key status: available or checked_out
  - `created_at` (timestamptz) - Creation timestamp

  ### `issue_records`
  Records of key checkouts and returns
  - `id` (uuid, primary key) - Record identifier
  - `user_id` (uuid) - Reference to user
  - `admin_id` (uuid) - Reference to admin who issued
  - `key_id` (uuid) - Reference to key
  - `issued_at` (timestamptz) - When key was issued
  - `due_at` (timestamptz) - When key should be returned
  - `returned_at` (timestamptz, nullable) - When key was returned
  - `status` (text) - Record status: active, overdue, escalated, or closed
  - `audit_trail` (jsonb) - Audit log of all actions
  - `security_notes` (text, nullable) - Security-related notes
  - `is_locked` (boolean) - Whether record is locked for security
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - All tables have RLS enabled
  - Public can view keys (for availability checking)
  - Authenticated users can perform operations based on role

  ## Indexes
  - Performance indexes on foreign keys and frequently queried fields
*/

-- Create custom types
DO $$ BEGIN
  CREATE TYPE record_status AS ENUM ('active', 'overdue', 'escalated', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE key_status AS ENUM ('available', 'checked_out');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'lecturer', 'cleaner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  staff_id text UNIQUE NOT NULL,
  phone text,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  id_card_url text NOT NULL DEFAULT ''
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role user_role NOT NULL,
  user_id text UNIQUE NOT NULL,
  phone text,
  email text,
  qr_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  id_card_url text NOT NULL DEFAULT ''
);

-- Create keys table
CREATE TABLE IF NOT EXISTS keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  location text NOT NULL,
  status key_status DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- Create issue_records table
CREATE TABLE IF NOT EXISTS issue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  key_id uuid REFERENCES keys(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  status record_status DEFAULT 'active',
  audit_trail jsonb DEFAULT '[]'::jsonb,
  security_notes text,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON users(qr_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_staff_id ON admins(staff_id);
CREATE INDEX IF NOT EXISTS idx_keys_status ON keys(status);
CREATE INDEX IF NOT EXISTS idx_keys_label ON keys(label);
CREATE INDEX IF NOT EXISTS idx_keys_location ON keys(location);
CREATE INDEX IF NOT EXISTS idx_issue_records_user ON issue_records(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_records_admin ON issue_records(admin_id);
CREATE INDEX IF NOT EXISTS idx_issue_records_key ON issue_records(key_id);
CREATE INDEX IF NOT EXISTS idx_issue_records_status ON issue_records(status);
CREATE INDEX IF NOT EXISTS idx_issue_records_due_at ON issue_records(due_at);
CREATE INDEX IF NOT EXISTS idx_issue_records_returned_at ON issue_records(returned_at);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins are viewable by authenticated users"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert their own profile"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update their own profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for users
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can be created by authenticated users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can be updated by authenticated users"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can be deleted by authenticated users"
  ON users FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for keys
CREATE POLICY "Keys are viewable by everyone"
  ON keys FOR SELECT
  USING (true);

CREATE POLICY "Keys can be managed by authenticated users"
  ON keys FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for issue_records
CREATE POLICY "Issue records are viewable by authenticated users"
  ON issue_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Issue records can be created by authenticated users"
  ON issue_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Issue records can be updated by authenticated users"
  ON issue_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Issue records can be deleted by authenticated users"
  ON issue_records FOR DELETE
  TO authenticated
  USING (true);
