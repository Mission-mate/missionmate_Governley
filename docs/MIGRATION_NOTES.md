# Migration notes: Base44 → Supabase + Vercel

## What this app is

Missionmate is a **governance and operations app for one organisation** (a not-for-profit or similar).
All signed-in staff share the same data. Main modules (sidebar):

| Module | What it covers | Main tables |
|---|---|---|
| Home / Conversations | Dashboard, team chat with groups, polls, pinned messages, files | conversations, conversation_messages, conversation_reads, conversation_poll_votes |
| Contacts | Contact database, smart lists, tags, custom fields, bulk import | contacts, smart_lists, tags, app_configs |
| Grant Management | Grants, providers, activities, finances, reporting obligations | grants, grant_providers, grant_activities, financial_entries, reporting_obligations |
| Program Management | Programs → projects → deliverables → tasks/subtasks, planners (grid), obligations | programs, projects, program_*/project_* tables, planner_* tables |
| Board Management | Meetings, participants, action registers, decision registers, documents, board people, skills matrix, committees, work plans | meetings, meeting_*, decisions, decision_registers, board_*, committees, committee_members, work_plans, work_items, … |
| Membership | Members, membership plans (structures), public join form (/join), submissions, renewal emails | members, membership_structures, membership_form_configs, membership_application_responses |
| Strategy | Strategy plans with levels 2–7, tasks, reports | strategies, strategy_blocks, strategy_level2_pillars, level5_tasks, level5_subtasks, strategy_block_reports |
| Risk | Risk register, controls, treatments, reviews, AI report write-ups | risks |
| Compliance | Obligations, registers (assets, WHS hazards/incidents/checks, contracts, complaints, donors, gifts, conflicts of interest, workforce, information assets, responsible people), policies with versions and AI Q&A | compliance_*, asset_*, whs_*, contracts, contract_*, complaints, donors, donations, gift_benefits, conflicts_of_interest, coi_people, workforce_*, information_assets, responsible_people, policy_documents, policy_versions |
| Settings | Organisation profile, team management and permissions, customisation, custom fields, tags | users, app_configs, organizations |
| Shared | Notes and documents attached to any record (by object_type + object_id) | note_pages, documents, document_folders |

## What Base44 was doing, and what replaces it

| Base44 piece | Where it is now |
|---|---|
| 103 entities (MongoDB-style records) | 103 Postgres tables, one per entity, same field names (`supabase/migrations/…0200`) |
| Entity security rules (RLS) | Postgres row level security (`…0300`). Same rules: most tables = any team member; Risk and PolicyVersion writes = server only; conversation messages = server only (read through the `conversations` function); `modules` config = admins only; Decisions = admin/user roles |
| Built-in User + login | Supabase Auth + `public.users` table (`…0100`) |
| Google / Microsoft login | Supabase Google and Azure (Entra ID) providers |
| `base44.entities.X.*` in the browser | `src/api/base44Client.js` + `supabase/functions/_shared/b44/entities.js` (same API, translated to PostgREST) |
| 44 backend functions (Deno) | 44 Supabase Edge Functions (also Deno) with the code unchanged except the import line |
| `Core.UploadFile` / `UploadPrivateFile` / `CreateFileSignedUrl` | Supabase Storage buckets `public-files` and `private-files` |
| `Core.InvokeLLM` | `invokeLLM` edge function → Anthropic or OpenAI (your own API key) |
| `Core.SendEmail` | Resend (your own API key) |
| `base44.users.inviteUser`, removing a user | `adminUsers` edge function |
| Realtime `subscribe()` | Supabase Realtime (conversations, grants, reporting obligations, planner subtasks) |
| Workflows (schedules / record triggers) | pg_cron jobs and database triggers calling edge functions (`…0600`) |

### Scheduled jobs and triggers

| Base44 workflow | Now |
|---|---|
| Nightly Membership Expiry Sweep (16:00 UTC) | cron `membership-expiry-sweep` → processMembershipExpiry |
| Nightly Member Plan Name Reconciliation (16:30 UTC) | cron `member-plan-name-reconcile` → reconcileMemberPlanNames |
| Nightly Grant Lookup Reconcile (17:00 UTC) | cron `grant-lookup-reconcile` → syncGrantLookups |
| Program Title Sync Sweep (every 15 min) | cron `program-title-sync-sweep` → syncProgramTitles |
| Program updated → sync titles | trigger on `programs` when the title changes |
| BoardPerson updated → sync participants | trigger on `board_people` when name / email / position changes |
| New Meeting → calendar event | **off** — needs Google Calendar / Outlook connection (Base44 connector) |
| Daily Meeting Reminders | **not carried over** — function `sendMeetingReminders` missing from the export |
| Daily Register Compliance Check | **not carried over** — function `checkRegisterCompliance` missing |
| Conflict of Interest Compliance Check | **not carried over** — function `checkConflictCompliance` missing |
| Seed Sample Data on New Organization | **not carried over** — function `seedNewOrganization` missing |

The four missing functions were already failing inside Base44. The app shows "overdue" states on
screen from the review dates, so the screens are not affected.

## Behaviour kept the same on purpose

- **Record ids** are 24-character hex strings, like Base44 (some server code checks this shape).
- **System fields** `id, created_date, updated_date, created_by, created_by_id` are filled in by the database.
- **Empty fields are left out** of records the app receives (Base44 did not return fields that were never set).
- **Query rules match MongoDB**, including how empty fields behave with `$ne`, `$nin`, `$nor`, `$not`.
  This was tested against a MongoDB query engine on real Postgres data (206 queries, all identical).
- **Unknown fields** the app saves (not in the schema) are kept in a hidden `_extra` column instead of failing.
  A scan of 351 save calls found none today; it is a safety net.
- **Required / enum rules** from Base44 are recorded as column comments, not hard database constraints,
  so no existing screen is blocked. They can be tightened after testing.

## Small logic changes (and why)

| Change | Why |
|---|---|
| New self sign-ups are `pending` and see "Access Restricted" until an admin adds them in Team Management | Base44 only let registered users in. Without this, anyone could sign up and read the organisation's data |
| First person to sign up becomes admin | Someone has to be able to manage the team on a fresh database |
| Normal users cannot change their own role / status / permissions (database check) | Prevents a user giving themselves admin rights through the API |
| Invite now also saves the first and last name typed in Add Team Member | Base44's invite dropped them |
| Register page goes straight in if email confirmation is turned off | Supabase gives a session immediately in that case |
| Reset password page accepts Supabase's link format (`token_hash`), and is also used for invites | Supabase sends different links than Base44 |
| Board person identity sync also runs when *position* changes | The function updates position too; the Base44 trigger only watched name/email |
| Chat directory hides people waiting for approval | They are not team members yet |
| Removed unused Base44 pages: MFA pages and the OAuth consent page | They were not connected to any route and only worked on Base44's servers |

## Known gaps / next steps

1. **Calendar sync** for new board meetings (needs Google / Microsoft calendar OAuth). Settings → Integrations
   shows the calendar as not connected.
2. **MFA** (two-factor) — Supabase supports authenticator apps if wanted.
3. **Multi-organisation** (each organisation with its own data). The app is built for one organisation;
   this needs an `organization_id` on every table and in every query — a separate project.
4. Help menu links still point to Base44's docs and YouTube channel (`src/components/help/HelpMenu.jsx`).
5. A few images are on Base44's image server — run `node scripts/copy-base44-images.mjs` once.
6. The JavaScript bundle is large (≈6 MB, same as before). Splitting pages into lazy-loaded chunks
   would make the first load faster.
7. After testing, consider adding foreign keys and NOT NULL / CHECK constraints for the required and enum fields.
