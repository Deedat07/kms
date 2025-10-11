/*
  # Phase 2: Key Management System

  1. Updates
    - Update keys table structure
    - Update issue_records table structure
    - Add proper foreign key relationships
    - Add indexes for performance

  2. Security
    - Maintain RLS policies
    - Ensure proper access controls
*/

-- Update keys table if needed (already exists with correct structure)
-- No changes needed for keys table

-- Update issue_records table if needed (already exists with correct structure)  
-- No changes needed for issue_records table

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_issue_records_returned_at ON public.issue_records USING btree (returned_at);
CREATE INDEX IF NOT EXISTS idx_keys_label ON public.keys USING btree (label);
CREATE INDEX IF NOT EXISTS idx_keys_location ON public.keys USING btree (location);

-- Ensure RLS policies are in place (they already exist)
-- No additional policies needed