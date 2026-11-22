# Missionmate (Governley) — Supabase + Vercel version

This is the Missionmate governance app, moved out of Base44.

- **Frontend:** React + Vite (the same screens as before) → hosted on **Vercel**
- **Database, login, files, live updates:** **Supabase** (Postgres, Auth, Storage, Realtime)
- **Server logic:** the 44 Base44 backend functions now run as **Supabase Edge Functions**
  (folder names like `delete-meeting`; the app still calls `invoke('deleteMeeting')` and the name is converted)
- **Scheduled jobs:** Supabase **pg_cron** (same times as Base44)
- **Sign-in:** email + password, Google, and **Microsoft Entra ID (Azure AD)**

The app code still calls `base44.entities.X.list()` etc. That object now comes from
`src/api/base44Client.js`, which talks to Supabase instead of Base44. So no screen had to change.

See [docs/MIGRATION_NOTES.md](docs/MIGRATION_NOTES.md) for what the app contains and what changed,
and [docs/DATABASE.md](docs/DATABASE.md) for the list of tables.

---

## Folder structure

```
.
├── src/                          React app (unchanged screens)
│   ├── api/base44Client.js       Base44-compatible client built on Supabase  ← the key file
│   ├── api/supabaseClient.js     Supabase connection (reads the VITE_ env variables)
│   └── lib/AuthContext.jsx       Sign-in state (Supabase Auth)
├── supabase/
│   ├── migrations/               SQL: run in order by `supabase db push`
│   │   ├── …0100_core.sql        users table, roles, helper functions, auth trigger
│   │   ├── …0200_entity_tables.sql   103 tables (generated)
│   │   ├── …0300_entity_rls.sql      security rules per table (generated)
│   │   ├── …0400_storage.sql     file buckets
│   │   ├── …0500_realtime.sql    live updates
│   │   └── …0600_automations.sql scheduled jobs + record triggers
│   ├── functions/                Edge Functions (one folder each, lowercase-with-hyphens names)
│   │   └── _shared/              shared code: base44.ts (server shim), b44/entities.js (data adapter), llm.ts, email.ts
│   └── config.toml               Supabase CLI settings
├── schema/entities/*.jsonc       The original Base44 entity definitions (source of truth for tables)
├── scripts/
│   ├── generate-schema.mjs       entity files → SQL + column map (`npm run db:generate`)
│   ├── port-base44-functions.mjs how the Base44 functions were copied (kept for reference)
│   └── copy-base44-images.mjs    copy the last few images off Base44's server (run once)
├── tests/                        `npm test`
├── vercel.json                   Vercel settings (single-page app routing)
└── .env.example                  frontend settings
```

---

## What you need

- A **Supabase** account (free plan is fine to start): https://supabase.com
- A **Vercel** account: https://vercel.com
- A **GitHub** account
- **Node.js 20 or newer** on your computer
- For Microsoft sign-in: access to the **Azure portal** of the organisation
- Optional: an **Anthropic** or **OpenAI** API key (AI features), a **Resend** account (emails)

---

## Step 1 — Create the Supabase project

1. In Supabase, click **New project**. Pick a region close to your users. Save the database password.
2. Open **Project Settings → API** (or the **Connect** button) and copy:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon / publishable key**
   - **Project ref** (the `xxxx` part)

## Step 2 — Create the database (run the SQL)

On your computer, in this folder:

```bash
npm install
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```

`db push` runs every file in `supabase/migrations` in order. It creates the 103 tables, the
security rules, the file buckets and the scheduled jobs.

> No CLI? You can also paste each migration file, in order, into **SQL Editor** in the dashboard.

## Step 3 — Sign-in settings

In the Supabase dashboard, **Authentication**:

**URL Configuration**
- **Site URL:** your Vercel address, e.g. `https://missionmate.vercel.app` (use `http://localhost:5173` until you have it)
- **Redirect URLs:** add `http://localhost:5173/**` and `https://YOUR-VERCEL-DOMAIN/**`

**Email templates** (Authentication → Emails). Change these three so they work with this app:

| Template | Put this in the message |
|---|---|
| Confirm signup | `Your code is: {{ .Token }}` (the Register page asks for this 6-digit code) |
| Reset password | `<a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>` |
| Invite user | `<a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=invite">Accept the invite and choose a password</a>` |

These links work even if the person opens the email on a different device.

> Supabase's built-in email service only sends a few emails per hour. For real use, add your own
> SMTP server under **Authentication → Emails → SMTP Settings** (Resend, SendGrid, Microsoft 365, …).

**Who gets access:** people can still create an account on the Register page (or with Microsoft /
Google), but they see **"Access Restricted"** and cannot read any data until an admin approves them.
To approve someone, go to **Settings → Team Management → Add Team Member** and add the same email.
People you invite there get access straight away. If you never want self sign-up, turn off
**Allow new users to sign up** (Authentication → Sign In / Providers) after the first admin has signed up.

## Step 4 — Microsoft Entra ID (Azure AD) sign-in

1. Azure portal → **Microsoft Entra ID → App registrations → New registration**
   - Name: `Missionmate`
   - Supported account types: **My organization only** (only your staff) — or multi-tenant if needed
   - Redirect URI: type **Web**, value `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
2. Copy the **Application (client) ID** and the **Directory (tenant) ID**.
3. **Certificates & secrets → New client secret.** Copy the **Value** (not the Secret ID).
   Put a reminder in your calendar to renew it before it expires.
4. Recommended: in **Manifest**, under `optionalClaims`, add `email` and `xms_edov` to `idToken`,
   and `xms_edov` to `accessToken`. This lets Supabase confirm the email address.
5. Supabase → **Authentication → Sign In / Providers → Azure**: turn it on and paste
   - Client ID = Application (client) ID
   - Secret = the secret Value
   - Azure Tenant URL = `https://login.microsoftonline.com/YOUR-TENANT-ID` (for "My organization only")

The **Microsoft** button on the Login and Register pages now uses Entra ID.
Google works the same way under **Providers → Google** (needs a Google Cloud OAuth client).

## Step 5 — Edge Functions (server logic)

1. Copy `supabase/functions/.env.example` to `supabase/functions/.env` and fill it in:
   - `CRON_SECRET` — any long random text (e.g. from `openssl rand -hex 32`)
   - `SITE_URL` — your Vercel address
   - `ANTHROPIC_API_KEY` **or** `OPENAI_API_KEY` — for policy Q&A and report write-ups (optional)
   - `RESEND_API_KEY` and `EMAIL_FROM` — for membership renewal emails (optional)
2. Upload the secrets and deploy all functions:

```bash
npx supabase secrets set --env-file supabase/functions/.env
npx supabase functions deploy
```

## Step 6 — Turn on the scheduled jobs

In **SQL Editor**, run this once (use your real values; the second value must be the same
`CRON_SECRET` as in Step 5):

```sql
select vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'project_url');
select vault.create_secret('YOUR-CRON-SECRET', 'cron_secret');
```

The jobs (membership expiry, nightly clean-ups, program title sync every 15 minutes) then run on
their own. You can see them under **Integrations → Cron**.

## Step 7 — Put the code on GitHub

```bash
git init
git add .
git commit -m "Missionmate on Supabase + Vercel"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/missionmate.git
git push -u origin main
```

`.env` files are in `.gitignore`, so no secrets are pushed.

## Step 8 — Deploy on Vercel

1. Vercel → **Add New → Project** → import the GitHub repository.
2. Framework: **Vite** (found automatically from `vercel.json`).
3. **Environment Variables:**
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon / publishable key
4. **Deploy.** Every push to `main` deploys again.
5. Copy the Vercel address and put it into Supabase **Site URL** and **Redirect URLs** (Step 3),
   and into `SITE_URL` (Step 5, then run the `secrets set` command again).

## Step 9 — First login

- **The first person to sign up becomes the admin.** So sign up first with the super admin account.
- Add the rest of the team from **Settings → Team Management → Add Team Member** (sends an invite email).
  This is also how you approve someone who signed up on their own.
- To make someone an admin by hand, in SQL Editor:

```sql
update public.users set role = 'admin' where email = 'person@example.org';
```

---

## Run it on your computer

```bash
cp .env.example .env.local     # then fill in the two values
npm install
npm run dev                    # http://localhost:5173
npm test                       # adapter unit tests
```

## Changing the database later

1. Edit or add a file in `schema/entities/` (same format as Base44).
2. `npm run db:generate` — updates the column map the app uses and the generated SQL files.
3. Make a **new** migration for the change (for example `npx supabase migration new add_field`)
   with the `alter table …` you need, then `npx supabase db push`.
   Never edit a migration file that has already been run on the live database.

## Things that are not switched on yet

- **Calendar events for new board meetings** (Google Calendar / Outlook). Base44 managed that
  connection; it needs its own sign-in setup now. The app keeps working without it.
- **Four Base44 automations** whose functions were missing from the export (meeting reminders,
  register / conflict-of-interest overdue checks, sample data for new organisations). Details in
  `docs/MIGRATION_NOTES.md`.
- **Two-factor sign-in (MFA).** The Base44 MFA pages were not connected to any route, so they were
  removed. Supabase supports authenticator-app MFA if you want to add it later.
- A few pictures still load from Base44's image server. Run `node scripts/copy-base44-images.mjs`
  once on your computer to copy them into `public/images`.
