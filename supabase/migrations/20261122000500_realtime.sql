-- Live updates (replaces Base44 entities.X.subscribe()).
-- Only the tables the app subscribes to are published. Row level security still
-- decides which rows each signed-in user receives.

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['conversations', 'grants', 'reporting_obligations', 'planner_subtasks'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
    -- Send the full old row on update/delete so listeners know which record changed.
    execute format('alter table public.%I replica identity full', t);
  end loop;
end;
$$;
