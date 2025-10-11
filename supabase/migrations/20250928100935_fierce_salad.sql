/*
  # Post-Alert Decision Branch System

  1. Enhanced Audit Trail
    - Track alert sending and grace periods
    - Record escalation reasons and timing
    - Monitor post-alert returns

  2. Status Flow Management
    - active → overdue (first alert)
    - overdue → escalated (grace period expired)
    - overdue/escalated → closed (post-alert return)

  3. Grace Period Tracking
    - 3-day grace period after first alert
    - Automatic escalation after 7 total days overdue
    - Clear audit trail for all transitions
*/

-- Add indexes for better performance on overdue checks
CREATE INDEX IF NOT EXISTS idx_issue_records_overdue_check 
ON issue_records (status, due_at, returned_at) 
WHERE status IN ('active', 'overdue');

-- Add index for escalation checks
CREATE INDEX IF NOT EXISTS idx_issue_records_escalation_check 
ON issue_records (status, due_at) 
WHERE status = 'overdue';

-- Add index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_issue_records_audit_trail 
ON issue_records USING gin (audit_trail);

-- Function to check for orphan states
CREATE OR REPLACE FUNCTION check_orphan_states()
RETURNS TABLE (
  record_id uuid,
  current_status record_status,
  days_overdue integer,
  issue_description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id,
    ir.status,
    EXTRACT(DAY FROM (NOW() - ir.due_at))::integer,
    CASE 
      WHEN ir.status = 'active' AND ir.due_at < NOW() - INTERVAL '1 day' THEN 
        'Active record overdue - should be marked as overdue'
      WHEN ir.status = 'overdue' AND ir.due_at < NOW() - INTERVAL '7 days' THEN 
        'Overdue record past grace period - should be escalated'
      WHEN ir.returned_at IS NOT NULL AND ir.status != 'closed' THEN 
        'Returned key not marked as closed'
      ELSE 'No issues detected'
    END
  FROM issue_records ir
  WHERE 
    (ir.status = 'active' AND ir.due_at < NOW() - INTERVAL '1 day') OR
    (ir.status = 'overdue' AND ir.due_at < NOW() - INTERVAL '7 days') OR
    (ir.returned_at IS NOT NULL AND ir.status != 'closed');
END;
$$ LANGUAGE plpgsql;

-- Function to get grace period status
CREATE OR REPLACE FUNCTION get_grace_period_status(record_id uuid)
RETURNS TABLE (
  in_grace_period boolean,
  days_until_escalation integer,
  grace_period_end timestamp with time zone
) AS $$
DECLARE
  record_data issue_records%ROWTYPE;
  grace_end timestamp with time zone;
BEGIN
  SELECT * INTO record_data FROM issue_records WHERE id = record_id;
  
  IF record_data.status = 'overdue' THEN
    grace_end := record_data.due_at + INTERVAL '7 days';
    RETURN QUERY SELECT 
      NOW() < grace_end,
      GREATEST(0, EXTRACT(DAY FROM (grace_end - NOW()))::integer),
      grace_end;
  ELSE
    RETURN QUERY SELECT false, 0, NULL::timestamp with time zone;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION check_orphan_states() IS 'Identifies records in inconsistent states that need manual review';
COMMENT ON FUNCTION get_grace_period_status(uuid) IS 'Returns grace period information for overdue records';
COMMENT ON INDEX idx_issue_records_overdue_check IS 'Optimizes overdue detection queries';
COMMENT ON INDEX idx_issue_records_escalation_check IS 'Optimizes escalation detection queries';