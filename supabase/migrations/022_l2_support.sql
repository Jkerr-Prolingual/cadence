-- 022: L2 (target language) support
-- Adds l2 column to profiles (default 'en' for backward compat)
-- Adds language column to books so library can be filtered by target language

-- ============================================================
-- PROFILES: add l2 column
-- ============================================================
alter table profiles add column if not exists l2 text default 'en';

-- ============================================================
-- AUTH TRIGGER: include l2 from signup metadata
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, l1, l2)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'l1', 'es'),
    coalesce(new.raw_user_meta_data->>'l2', 'en')
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- BOOKS: add language column (the L2 the book teaches)
-- ============================================================
alter table books add column if not exists language text default 'en';
