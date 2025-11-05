import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  template_id: string | null;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
  external_id: string | null;
  metadata: any;
}

export function useEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
  });

  const fetchLogs = async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    setLoading(true);
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('sent_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('sent_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email logs:', error);
    } else {
      setLogs(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

  const calculateStats = (logData: EmailLog[]) => {
    setStats({
      total: logData.length,
      sent: logData.filter(log => log.status === 'sent').length,
      failed: logData.filter(log => log.status === 'failed').length,
      pending: logData.filter(log => log.status === 'pending').length,
    });
  };

  const getLogsByRecipient = async (email: string) => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('recipient_email', email)
      .order('sent_at', { ascending: false });

    return { data, error };
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    stats,
    fetchLogs,
    getLogsByRecipient,
  };
}
