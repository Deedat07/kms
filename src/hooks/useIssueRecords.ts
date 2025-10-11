import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type IssueRecord = Database['public']['Tables']['issue_records']['Row'];
type IssueRecordInsert = Database['public']['Tables']['issue_records']['Insert'];

interface IssueRecordWithDetails extends IssueRecord {
  users: {
    name: string;
    role: string;
    user_id: string;
  } | null;
  keys: {
    label: string;
    location: string;
  } | null;
  admins: {
    name: string;
    staff_id: string;
  } | null;
}

export function useIssueRecords() {
  const [records, setRecords] = useState<IssueRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('issue_records')
        .select(`
          *,
          users (name, role, user_id),
          keys (label, location),
          admins (name, staff_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching issue records:', error);
    } finally {
      setLoading(false);
    }
  };

  const createIssueRecord = async (recordData: Omit<IssueRecordInsert, 'id' | 'created_at' | 'audit_trail'>) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      const auditEntry = {
        action: 'issued',
        timestamp: new Date().toISOString(), // Store in UTC
        admin_id: authUser.user.id,
        notes: 'Key issued to user'
      };

      const { data, error } = await supabase
        .from('issue_records')
        .insert({
          ...recordData,
          admin_id: authUser.user.id,
          audit_trail: [auditEntry]
        })
        .select()
        .single();

      if (error) throw error;

      // Update key status to checked_out
      await supabase
        .from('keys')
        .update({ status: 'checked_out' })
        .eq('id', recordData.key_id);

      // Refresh the records to get the latest data
      await fetchRecords();

      return { data, error: null };
    } catch (error) {
      console.error('Error creating issue record:', error);
      return { data: null, error };
    }
  };

  const returnKey = async (recordId: string, notes?: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      // Get current record to update audit trail
      const { data: currentRecord, error: fetchError } = await supabase
        .from('issue_records')
        .select('audit_trail, key_id')
        .eq('id', recordId)
        .single();

      if (fetchError) throw fetchError;

      const auditEntry = {
        action: 'returned',
        timestamp: new Date().toISOString(), // Store in UTC
        admin_id: authUser.user.id,
        notes: notes || 'Key returned',
        previous_status: currentRecord.status
      };

      const updatedAuditTrail = [...(currentRecord.audit_trail || []), auditEntry];

      // Determine if this was a post-alert return
      const isPostAlertReturn = currentRecord.status === 'overdue' || currentRecord.status === 'escalated';
      const returnNotes = isPostAlertReturn 
        ? `${notes || 'Key returned'} - Returned after ${currentRecord.status} alert`
        : notes || 'Key returned';

      const { data, error } = await supabase
        .from('issue_records')
        .update({
          returned_at: new Date().toISOString(), // Store in UTC
          status: 'closed',
          audit_trail: updatedAuditTrail,
          security_notes: isPostAlertReturn ? returnNotes : currentRecord.security_notes
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;

      // Update key status back to available
      await supabase
        .from('keys')
        .update({ status: 'available' })
        .eq('id', currentRecord.key_id);

      // Refresh the records to get the latest data
      await fetchRecords();

      return { data, error: null };
    } catch (error) {
      console.error('Error returning key:', error);
      return { data: null, error };
    }
  };

  const escalateRecord = async (recordId: string, notes?: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      // Get current record to update audit trail
      const { data: currentRecord, error: fetchError } = await supabase
        .from('issue_records')
        .select('audit_trail')
        .eq('id', recordId)
        .single();

      if (fetchError) throw fetchError;

      const auditEntry = {
        action: 'escalated',
        timestamp: new Date().toISOString(), // Store in UTC
        admin_id: authUser.user.id,
        notes: notes || 'Record escalated due to overdue status',
        escalation_reason: 'manual_escalation'
      };

      const updatedAuditTrail = [...(currentRecord.audit_trail || []), auditEntry];

      const { data, error } = await supabase
        .from('issue_records')
        .update({
          status: 'escalated',
          audit_trail: updatedAuditTrail,
          security_notes: notes,
          is_locked: true
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;

      // Refresh the records to get the latest data
      await fetchRecords();

      return { data, error: null };
    } catch (error) {
      console.error('Error escalating record:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchRecords();

    // Set up real-time subscription for issue_records
    const issueRecordsChannel = supabase
      .channel('issue-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_records'
        },
        (payload) => {
          console.log('Issue records table change detected:', payload);
          fetchRecords(); // Refresh data when changes occur
        }
      )
      .subscribe();

    // Also listen to keys table changes since key status affects issue records
    const keysChannel = supabase
      .channel('keys-changes-for-issues')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'keys'
        },
        (payload) => {
          console.log('Keys table change detected (for issues):', payload);
          fetchRecords(); // Refresh issue records when key status changes
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(issueRecordsChannel);
      supabase.removeChannel(keysChannel);
    };
  }, []);

  return {
    records,
    loading,
    fetchRecords,
    createIssueRecord,
    returnKey,
    escalateRecord,
  };
}