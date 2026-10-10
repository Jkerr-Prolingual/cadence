-- Lock down role column: users cannot change their own role via self-update.
-- Teacher/admin promotion is done manually in the Supabase dashboard.

-- Replace the permissive self-update policy with one that excludes the role column.
drop policy if exists "Users update own profile" on profiles;

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id)
  with check (role = (select p.role from profiles p where p.id = auth.uid()));
