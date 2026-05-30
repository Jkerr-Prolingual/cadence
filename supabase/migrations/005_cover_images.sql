-- Add cover image URL to curated_texts
alter table curated_texts add column if not exists cover_image_url text;

-- Public storage bucket for cover images
insert into storage.buckets (id, name, public)
values ('text-covers', 'text-covers', true)
on conflict (id) do nothing;

-- Anyone can read cover images
create policy "Anyone reads text covers"
  on storage.objects for select
  using (bucket_id = 'text-covers');

-- Only admins can upload/update/delete
create policy "Admins upload text covers"
  on storage.objects for insert
  with check (bucket_id = 'text-covers' and public.is_admin());

create policy "Admins update text covers"
  on storage.objects for update
  using (bucket_id = 'text-covers' and public.is_admin());

create policy "Admins delete text covers"
  on storage.objects for delete
  using (bucket_id = 'text-covers' and public.is_admin());
