import { supabase } from './supabase';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SendBulkEmailParams {
  subject: string;
  body: string;
  templateId?: string;
  filters?: {
    roles?: string[];
    includeEmails?: string[];
    excludeEmails?: string[];
  };
  variables?: Record<string, string>;
}

export async function sendCustomEmail(params: SendEmailParams) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-custom-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending custom email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBulkEmail(params: SendBulkEmailParams) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-bulk-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send bulk email');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending bulk email:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserEmailPreferences(userEmail: string) {
  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('user_email', userEmail)
    .maybeSingle();

  return { data, error };
}

export async function updateUserEmailPreferences(
  userEmail: string,
  preferences: {
    welcome_emails?: boolean;
    reminder_emails?: boolean;
    overdue_emails?: boolean;
    announcement_emails?: boolean;
    digest_frequency?: 'immediate' | 'daily' | 'weekly' | 'none';
  }
) {
  const { data: existing } = await getUserEmailPreferences(userEmail);

  if (existing) {
    const { data, error } = await supabase
      .from('user_email_preferences')
      .update({ ...preferences, updated_at: new Date().toISOString() })
      .eq('user_email', userEmail)
      .select()
      .single();

    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('user_email_preferences')
      .insert({
        user_email: userEmail,
        ...preferences,
      })
      .select()
      .single();

    return { data, error };
  }
}

export async function unsubscribeUser(userEmail: string) {
  const { data, error } = await supabase
    .from('user_email_preferences')
    .update({
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_email', userEmail)
    .select()
    .single();

  return { data, error };
}

export async function resubscribeUser(userEmail: string) {
  const { data, error } = await supabase
    .from('user_email_preferences')
    .update({
      unsubscribed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_email', userEmail)
    .select()
    .single();

  return { data, error };
}

export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

export function extractTemplateVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}
