-- Edge functions are deployed with hyphenated lowercase names (delete-meeting), because the
-- Supabase deploy tool lowercases function names. The scheduled jobs and triggers still pass
-- the original Base44 names (processMembershipExpiry), so convert them here.

create or replace function private.call_edge_function(fn text, payload jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_url text;
  secret text;
  slug text := lower(regexp_replace(fn, '([a-z0-9])([A-Z])', '\1-\2', 'g'));
  request_id bigint;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret';
  if base_url is null or secret is null then
    raise warning 'Edge function % not called: add the project_url and cron_secret secrets to Vault.', slug;
    return null;
  end if;
  select net.http_post(
    url := rtrim(base_url, '/') || '/functions/v1/' || slug,
    body := coalesce(payload, '{}'::jsonb),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    timeout_milliseconds := 150000
  ) into request_id;
  return request_id;
end;
$$;

revoke all on function private.call_edge_function(text, jsonb) from public, anon, authenticated;
