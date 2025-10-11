/*
  # Remove dummy users from the database

  This migration removes the following dummy users:
  - John Smith
  - Dr. Sarah Johnson  
  - Mike Wilson
  - Alice Brown
  - Prof. David Lee

  After this migration, only users registered by admins will remain.
*/

DELETE FROM public.users 
WHERE name IN (
  'John Smith',
  'Dr. Sarah Johnson',
  'Mike Wilson', 
  'Alice Brown',
  'Prof. David Lee'
);