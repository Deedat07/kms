import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Key = Database['public']['Tables']['keys']['Row'];
type KeyInsert = Database['public']['Tables']['keys']['Insert'];

export function useKeys() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async (keyData: Omit<KeyInsert, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('keys')
        .insert(keyData)
        .select()
        .single();

      if (error) throw error;

      // Add the new key to the local state immediately
      setKeys(prevKeys => [data, ...prevKeys]);

      return { data, error: null };
    } catch (error) {
      console.error('Error creating key:', error);
      return { data: null, error };
    }
  };

  const updateKey = async (id: string, updates: Partial<Key>) => {
    try {
      // Store original key for rollback if needed
      const originalKeys = [...keys];
      
      // Optimistically update the local state immediately
      setKeys(prevKeys => 
        prevKeys.map(key => 
          key.id === id ? { ...key, ...updates } : key
        )
      );

      const { data, error } = await supabase
        .from('keys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with server response to ensure data consistency
      setKeys(prevKeys => 
        prevKeys.map(key => 
          key.id === id ? data : key
        )
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error updating key:', error);
      // Revert optimistic update on error
      setKeys(originalKeys);
      return { data: null, error };
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove the key from local state immediately
      setKeys(prevKeys => prevKeys.filter(key => key.id !== id));

      return { error: null };
    } catch (error) {
      console.error('Error deleting key:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchKeys();

    // Set up real-time subscription
    const channel = supabase
      .channel('keys-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keys'
        },
        (payload) => {
          console.log('Keys table change detected:', payload);
          fetchKeys(); // Refresh data when changes occur
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    keys,
    loading,
    fetchKeys,
    createKey,
    updateKey,
    deleteKey,
  };
}