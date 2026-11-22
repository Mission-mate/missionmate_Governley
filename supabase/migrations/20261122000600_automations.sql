-- Automations (replaces the Base44 "workflows").
--
-- Scheduled jobs use pg_cron, and database triggers call edge functions through pg_net.
-- Both read two secrets from Supabase Vault, which you add ONCE in the SQL editor
-- (see README, step "Turn on the scheduled jobs"):
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as the CRON_SECRET edge function secret>', 'cron_secret');
--
-- Until those secrets exist the jobs just log a warning and do nothing.
--
-- Base44 workflows NOT carried over, because their functions were not in the export
-- (they were already failing in Base44):
--   Daily Meeting Reminders              -> sendMeetingReminders (missing)
--   Daily Register Compliance Check      -> checkRegisterCompliance (missing)
--   Conflict of Interest Compliance Check-> checkConflictCompliance (missing)
--   Seed Sample Data on New Organization -> seedNewOrganization (missing)
-- The app already shows "overdue" states on screen from review dates, so these are optional.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- POST a JSON body to an edge function, authenticated with the shared cron secret.
create or replace function private.call_edge_function(fn text, payload jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_url text;
  secret text;
  request_id bigint;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret';
  if base_url is null or secret is null then
    raise warning 'Edge function % not called: add the project_url and cron_secret secrets to Vault.', fn;
    return null;
  end if;
  select net.http_post(
    url := rtrim(base_url, '/') || '/functions/v1/' || fn,
    body := coalesce(payload, '{}'::jsonb),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    timeout_milliseconds := 150000
  ) into request_id;
  return request_id;
end;
$$;

revoke all on function private.call_edge_function(text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Scheduled jobs (times are UTC, same as in Base44)
-- ---------------------------------------------------------------------------

-- Nightly Membership Expiry Sweep: expire members past their grace period, send reminder emails.
select cron.schedule('membership-expiry-sweep', '0 16 * * *',
  $$ select private.call_edge_function('processMembershipExpiry', '{}'::jsonb); $$);

-- Nightly Member Plan Name Reconciliation: repair cached plan names on members.
select cron.schedule('member-plan-name-reconcile', '30 16 * * *',
  $$ select private.call_edge_function('reconcileMemberPlanNames', '{}'::jsonb); $$);

-- Nightly Grant Lookup Reconcile: repair cached provider/activity names on grants.
select cron.schedule('grant-lookup-reconcile', '0 17 * * *',
  $$ select private.call_edge_function('syncGrantLookups', '{"action":"reconcile"}'::jsonb); $$);

-- Program Title Sync Sweep: every 15 minutes, retry program title copies that are pending/failed.
select cron.schedule('program-title-sync-sweep', '*/15 * * * *',
  $$ select private.call_edge_function('syncProgramTitles', '{"mode":"sweep"}'::jsonb); $$);

-- ---------------------------------------------------------------------------
-- Record triggers (Base44 "entity" workflows)
-- Payload shape is the same Base44 sent: { event, data, old_data }.
-- ---------------------------------------------------------------------------

-- Sync BoardPerson Identity to Participants: name / email / position changed.
create or replace function private.on_board_person_identity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.call_edge_function('syncParticipantIdentity', jsonb_build_object(
    'event', jsonb_build_object('type', 'update', 'entity_name', 'BoardPerson', 'entity_id', new.id),
    'data', to_jsonb(new) - '_extra',
    'old_data', to_jsonb(old) - '_extra'
  ));
  return new;
end;
$$;

create trigger board_people_sync_identity
  after update on public.board_people
  for each row
  when (old.member_name is distinct from new.member_name
     or old.member_email is distinct from new.member_email
     or old.position is distinct from new.position)
  execute function private.on_board_person_identity_change();

-- Program title changed -> copy the new title onto linked projects.
create or replace function private.on_program_title_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.call_edge_function('syncProgramTitles', jsonb_build_object('program_id', new.id));
  return new;
end;
$$;

create trigger programs_sync_title
  after update on public.programs
  for each row
  when (old.title is distinct from new.title)
  execute function private.on_program_title_change();

-- "Create Calendar Event on New Board Meeting" is not switched on: it needs a Google Calendar
-- or Outlook connection (Base44 connectors), which does not exist outside Base44 yet.
-- When calendar sign-in is added, enable it with:
--
-- create or replace function private.on_meeting_created() returns trigger
-- language plpgsql security definer set search_path = '' as $f$
-- begin
--   perform private.call_edge_function('createMeetingCalendarEvent', jsonb_build_object(
--     'event', jsonb_build_object('type', 'create', 'entity_name', 'Meeting', 'entity_id', new.id),
--     'data', to_jsonb(new) - '_extra'));
--   return new;
-- end; $f$;
-- create trigger meetings_calendar_event after insert on public.meetings
--   for each row execute function private.on_meeting_created();
