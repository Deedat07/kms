import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'reminder' | 'overdue' | 'return_confirmation' | 'announcement' | 'security' | 'custom';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const createTemplate = async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select()
      .single();

    if (!error) {
      await fetchTemplates();
    }

    return { data, error };
  };

  const updateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    const { data, error } = await supabase
      .from('email_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      await fetchTemplates();
    }

    return { data, error };
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchTemplates();
    }

    return { error };
  };

  const toggleTemplateStatus = async (id: string, isActive: boolean) => {
    return updateTemplate(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
  };
}
