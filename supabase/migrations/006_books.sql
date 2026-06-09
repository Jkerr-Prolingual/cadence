-- Books table: groups curated_texts (chapters) into books
create table if not exists books (
  id text primary key,
  title text not null,
  author text,
  description text,
  cefr_estimate text,
  cover_image_url text,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now()
);

alter table books enable row level security;

create policy "Anyone reads published books"
  on books for select using (status = 'published');
create policy "Admins manage all books"
  on books for all using (public.is_admin());

-- Add book_id + chapter_order to curated_texts
alter table curated_texts add column if not exists book_id text references books(id);
alter table curated_texts add column if not exists chapter_order integer;

-- Storage bucket for book covers (public)
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "Anyone reads book covers"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "Admins upload book covers"
  on storage.objects for insert
  with check (bucket_id = 'book-covers' and public.is_admin());

create policy "Admins update book covers"
  on storage.objects for update
  using (bucket_id = 'book-covers' and public.is_admin());

create policy "Admins delete book covers"
  on storage.objects for delete
  using (bucket_id = 'book-covers' and public.is_admin());
