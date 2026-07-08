-- Check if the anon role has INSERT permission on the landing page tables.
-- Run in Supabase SQL Editor — read-only, no changes to your data.

SELECT
  t.tablename,
  has_table_privilege('anon', t.schemaname || '.' || t.tablename, 'INSERT') AS anon_can_insert
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('email_subscribers', 'contact_messages');
