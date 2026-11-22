-- Core: helper functions, the users (team member) table, and auth hooks.
-- Runs before the generated entity tables.

-- ---------------------------------------------------------------------------
-- Record ids: 24 hex characters, the same shape Base44 used (some server code checks this).
-- ---------------------------------------------------------------------------
create or replace function public.new_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select left(replace(gen_random_uuid()::text, '-', ''), 24);
$$;

-- ---------------------------------------------------------------------------
-- Keeps the Base44 system fields right on every insert / update:
--   created_date, updated_date, created_by (email), created_by_id (user id).
-- ---------------------------------------------------------------------------
create or replace function public.b44_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_date := coalesce(new.created_date, now());
    new.updated_date := now();
    if new.created_by_id is null then
      new.created_by_id := (select auth.uid())::text;
    end if;
    if new.created_by is null then
      new.created_by := (select auth.jwt() ->> 'email');
    end if;
  else
    new.updated_date := now();
    new.created_date := old.created_date;
    new.created_by := old.created_by;
    new.created_by_id := old.created_by_id;
  end if;
  if new._extra is null then
    new._extra := '{}'::jsonb;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users: one row per team member, linked to Supabase Auth (auth.users).
-- Columns = Base44 built-in user fields + the custom User entity fields.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  _extra jsonb not null default '{}'::jsonb,
  email text,
  full_name text,
  phone text,
  theme text,
  first_name text,
  last_name text,
  avatar_url text,
  role text not null default 'user',
  status text not null default 'active',
  is_system_admin boolean not null default false,
  last_login timestamptz,
  access_control text not null default 'full',
  permissions jsonb
);

comment on table public.users is 'Team members. One row per Supabase Auth user (Base44 entity: User).';
comment on column public.users.role is 'one of: owner | admin | user | guest. admin = administrative access (server functions check role = admin).';
comment on column public.users.status is 'one of: active | invited | pending | suspended. pending = signed up on their own and waiting for an admin; pending and suspended users have no data access.';
comment on column public.users.is_system_admin is 'System Admin access for the MissionMate admin portal.';
comment on column public.users.access_control is 'full = every module; restricted = use the permissions map.';
comment on column public.users.permissions is 'Map of permission key (module id or module.submodule) to boolean, used when access_control = restricted.';

create index if not exists users_email_idx on public.users (lower(email));

-- ---------------------------------------------------------------------------
-- Role helpers used by row level security. SECURITY DEFINER so they can read
-- public.users without running into the users table's own policies.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.role from public.users u where u.id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role in ('admin', 'owner'));
$$;

-- A signed-in team member with access (active or invited; not pending or suspended).
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users u where u.id = (select auth.uid()) and u.status in ('active', 'invited'));
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> new users row.
--  * The very first person to sign up becomes an active admin.
--  * People invited from Settings > Team Management start as 'invited' (they have access).
--  * Anyone else who signs up on their own (email, Google or Microsoft) starts as 'pending':
--    they see "Access Restricted" until an admin adds them in Team Management with the same email.
-- (Role is never taken from sign-up metadata, because users can set that themselves.)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
  first_name text := nullif(trim(coalesce(meta ->> 'first_name', meta ->> 'given_name', '')), '');
  last_name text := nullif(trim(coalesce(meta ->> 'last_name', meta ->> 'family_name', '')), '');
  is_first boolean;
begin
  select not exists (select 1 from public.users) into is_first;
  if first_name is null and full_name is not null then
    first_name := split_part(full_name, ' ', 1);
    last_name := coalesce(last_name, nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''));
  end if;
  insert into public.users (id, email, full_name, first_name, last_name, avatar_url, role, status)
  values (
    new.id,
    new.email,
    coalesce(full_name, nullif(trim(concat_ws(' ', first_name, last_name)), '')),
    first_name,
    last_name,
    coalesce(meta ->> 'avatar_url', meta ->> 'picture'),
    case when is_first then 'admin' else 'user' end,
    case
      when is_first then 'active'
      when new.invited_at is not null then 'invited'
      else 'pending'
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep the email in step when a user changes it in Supabase Auth.
create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_auth_user_email_change();

-- ---------------------------------------------------------------------------
-- users: protect admin-only fields. A normal user may edit their own name,
-- phone, picture and theme, but not their role, status or permissions.
-- ---------------------------------------------------------------------------
-- (Not SECURITY DEFINER on purpose: current_user must be the caller's role.)
create or replace function public.users_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_date := now();
  new.id := old.id;
  new.created_date := old.created_date;
  if new._extra is null then new._extra := '{}'::jsonb; end if;
  -- Service role (edge functions), the dashboard SQL editor, and admins may change anything.
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.is_system_admin is distinct from old.is_system_admin
     or new.access_control is distinct from old.access_control
     or new.permissions is distinct from old.permissions
     or new.email is distinct from old.email then
    raise exception 'Only an admin can change role, status, access or email'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists users_before_update on public.users;
create trigger users_before_update
  before update on public.users
  for each row execute function public.users_before_update();

alter table public.users enable row level security;
revoke all on public.users from anon;
grant select, update on public.users to authenticated;
grant all on public.users to service_role;

-- Everyone sees their own row; team members see the team; only admins see people waiting for approval.
create policy users_select on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or ((select public.is_member()) and status <> 'pending')
  );

create policy users_update on public.users
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- No insert / delete policies: rows are created by the auth trigger and removed
-- by deleting the auth user (adminUsers edge function).

-- ---------------------------------------------------------------------------
-- Called by the app after every sign-in: records last_login and turns an
-- 'invited' member into 'active'.
-- ---------------------------------------------------------------------------
create or replace function public.touch_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
     set last_login = now(),
         status = case when status = 'invited' then 'active' else status end
   where id = (select auth.uid());
end;
$$;

revoke all on function public.touch_login() from public, anon;
grant execute on function public.touch_login() to authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.handle_auth_user_email_change() from public, anon, authenticated;
