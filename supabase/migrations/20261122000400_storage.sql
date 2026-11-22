-- File storage (replaces Base44 Core.UploadFile / UploadPrivateFile / CreateFileSignedUrl).
--
--   public-files   logos, profile pictures, form banners. Anyone with the link can view.
--   private-files  documents, policy files, chat attachments. Only signed-in team members,
--                  and only through short-lived signed links.

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('public-files', 'public-files', true, 52428800),     -- 50 MB
  ('private-files', 'private-files', false, 104857600)  -- 100 MB
on conflict (id) do nothing;

-- Public bucket: team members upload, everyone can read (bucket is public).
create policy "public-files: members upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-files' and (select public.is_member()));

create policy "public-files: members update"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-files' and (select public.is_member()));

create policy "public-files: members delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-files' and (select public.is_member()));

-- Private bucket: team members upload and read (signed links are created for reading).
create policy "private-files: members upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'private-files' and (select public.is_member()));

create policy "private-files: members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'private-files' and (select public.is_member()));

create policy "private-files: members delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'private-files' and (select public.is_member()));
