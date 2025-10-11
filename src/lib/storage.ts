import { supabase } from './supabase';

export const uploadIdCard = async (file: File, folder: 'admin-ids' | 'user-ids'): Promise<{ url: string | null; error: any }> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: { message: 'Please upload a valid image file (JPEG, PNG, or WebP)' } };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { url: null, error: { message: 'File size must be less than 5MB' } };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('id-cards')
      .upload(filePath, file);

    if (error) {
      return { url: null, error };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('id-cards')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
};

export const deleteIdCard = async (url: string): Promise<{ error: any }> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('id-cards')
      .remove([filePath]);

    return { error };
  } catch (error) {
    return { error };
  }
};