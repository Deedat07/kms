import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          name: string;
          staff_id: string;
          phone: string | null;
          email: string;
          created_at: string;
          id_card_url: string;
        };
        Insert: {
          id?: string;
          name: string;
          staff_id: string;
          phone?: string | null;
          email: string;
          created_at?: string;
          id_card_url: string;
        };
        Update: {
          id?: string;
          name?: string;
          staff_id?: string;
          phone?: string | null;
          email?: string;
          created_at?: string;
          id_card_url?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          role: 'student' | 'lecturer' | 'cleaner';
          user_id: string;
          phone: string | null;
          email: string | null;
          qr_code: string;
          created_at: string;
          id_card_url: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: 'student' | 'lecturer' | 'cleaner';
          user_id: string;
          phone?: string | null;
          email?: string | null;
          qr_code: string;
          created_at?: string;
          id_card_url: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'student' | 'lecturer' | 'cleaner';
          user_id?: string;
          phone?: string | null;
          email?: string | null;
          qr_code?: string;
          created_at?: string;
          id_card_url?: string;
        };
      };
      keys: {
        Row: {
          id: string;
          label: string;
          location: string;
          status: 'available' | 'checked_out' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          location: string;
          status?: 'available' | 'checked_out' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          location?: string;
          status?: 'available' | 'checked_out' | null;
          created_at?: string;
        };
      };
      issue_records: {
        Row: {
          id: string;
          user_id: string | null;
          admin_id: string | null;
          key_id: string | null;
          issued_at: string | null;
          due_at: string;
          returned_at: string | null;
          status: 'active' | 'overdue' | 'escalated' | 'closed' | null;
          audit_trail: any;
          security_notes: string | null;
          is_locked: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          admin_id?: string | null;
          key_id?: string | null;
          issued_at?: string | null;
          due_at: string;
          returned_at?: string | null;
          status?: 'active' | 'overdue' | 'escalated' | 'closed' | null;
          audit_trail?: any;
          security_notes?: string | null;
          is_locked?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          admin_id?: string | null;
          key_id?: string | null;
          issued_at?: string | null;
          due_at?: string;
          returned_at?: string | null;
          status?: 'active' | 'overdue' | 'escalated' | 'closed' | null;
          audit_trail?: any;
          security_notes?: string | null;
          is_locked?: boolean | null;
          created_at?: string | null;
        };
      };
    };
  };
};