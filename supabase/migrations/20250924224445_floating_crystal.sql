/*
  # Create storage bucket for ID cards

  1. Storage Setup
    - Create 'id-cards' bucket for storing user and admin ID card images
    - Configure bucket with 5MB file size limit
    - Allow image file types only (JPEG, PNG, WebP)
    - Set public access for uploaded files

  2. Security Policies
    - Allow authenticated users to upload files
    - Allow authenticated users to read files
    - Allow authenticated users to delete files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-cards',
  'id-cards', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload ID cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'id-cards');

-- Policy to allow authenticated users to read files
CREATE POLICY "Authenticated users can view ID cards"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'id-cards');

-- Policy to allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete ID cards"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'id-cards');