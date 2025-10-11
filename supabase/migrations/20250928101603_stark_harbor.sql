/*
  # Add Security Escalation Features

  1. Database Changes
    - Add `is_locked` column to issue_records for security lock
    - Add indexes for security queries
    - Add security validation functions
  
  2. Security Features
    - Record locking mechanism
    - Security audit trail enhancements
    - Escalation tracking improvements
*/

-- Add is_locked column to issue_records table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'issue_records' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE issue_records ADD COLUMN is_locked boolean DEFAULT false;
  END IF;
END $$;

-- Add index for security queries
CREATE INDEX IF NOT EXISTS idx_issue_records_security_locked 
ON issue_records (status, is_locked) 
WHERE status = 'escalated';

-- Add index for escalated records
CREATE INDEX IF NOT EXISTS idx_issue_records_escalated_status 
ON issue_records (status, created_at) 
WHERE status = 'escalated';

-- Function to automatically lock records when escalated
CREATE OR REPLACE FUNCTION lock_escalated_records()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to escalated, lock the record
  IF NEW.status = 'escalated' AND OLD.status != 'escalated' THEN
    NEW.is_locked = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically lock escalated records
DROP TRIGGER IF EXISTS trigger_lock_escalated_records ON issue_records;
CREATE TRIGGER trigger_lock_escalated_records
  BEFORE UPDATE ON issue_records
  FOR EACH ROW
  EXECUTE FUNCTION lock_escalated_records();

-- Function to validate security record integrity
CREATE OR REPLACE FUNCTION validate_security_records()
RETURNS TABLE (
  record_id uuid,
  issue_type text,
  description text
) AS $$
BEGIN
  -- Check for escalated records that aren't locked
  RETURN QUERY
  SELECT 
    id as record_id,
    'unlocked_escalated' as issue_type,
    'Escalated record is not locked' as description
  FROM issue_records 
  WHERE status = 'escalated' AND (is_locked IS NULL OR is_locked = false);
  
  -- Check for locked records that aren't escalated
  RETURN QUERY
  SELECT 
    id as record_id,
    'locked_non_escalated' as issue_type,
    'Non-escalated record is locked' as description
  FROM issue_records 
  WHERE is_locked = true AND status != 'escalated';
  
  -- Check for escalated records without proper audit trail
  RETURN QUERY
  SELECT 
    id as record_id,
    'missing_escalation_audit' as issue_type,
    'Escalated record missing escalation audit entry' as description
  FROM issue_records 
  WHERE status = 'escalated' 
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(audit_trail) AS elem
      WHERE elem->>'action' = 'escalated'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get security statistics
CREATE OR REPLACE FUNCTION get_security_stats()
RETURNS TABLE (
  total_escalated bigint,
  critical_risk bigint,
  high_risk bigint,
  medium_risk bigint,
  avg_days_overdue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_escalated,
    COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - due_at::timestamp)) > 14) as critical_risk,
    COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - due_at::timestamp)) BETWEEN 8 AND 14) as high_risk,
    COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - due_at::timestamp)) <= 7) as medium_risk,
    ROUND(AVG(EXTRACT(DAY FROM (NOW() - due_at::timestamp))), 1) as avg_days_overdue
  FROM issue_records 
  WHERE status = 'escalated';
END;
$$ LANGUAGE plpgsql;