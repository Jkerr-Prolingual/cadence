-- 014: Multi-L1 support
-- Add l1 to auth trigger, refactor srs_cards for language-agnostic translations

-- ============================================================
-- AUTH TRIGGER: include l1 from signup metadata
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, l1)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'l1', 'es')
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- SRS CARDS: rename spanish → translation, add l1 column
-- ============================================================
alter table srs_cards add column if not exists translation text;
update srs_cards set translation = spanish where translation is null and spanish is not null;

alter table srs_cards add column if not exists l1 text default 'es';

-- Update card_type constraint to accept 'translation'
alter table srs_cards drop constraint if exists srs_cards_card_type_check;
alter table srs_cards add constraint srs_cards_card_type_check
  check (card_type in ('translation', 'spanish', 'cloze', 'dual', 'definition', 'structure_cloze'));
