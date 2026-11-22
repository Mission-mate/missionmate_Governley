/**
 * Server-side stand-in for `createClientFromRequest` from the Base44 SDK, built on Supabase.
 *
 * The original Base44 functions were copied over with only their import line changed, so they
 * still call:
 *   base44.auth.me() / isAuthenticated()
 *   base44.entities.X.*               -> as the signed-in user (row level security applies)
 *   base44.asServiceRole.entities.X.* -> with the service role key (bypasses row level security)
 *   base44.integrations.Core.InvokeLLM / SendEmail / CreateFileSignedUrl / UploadFile
 *   base44.asServiceRole.connectors.getConnection(...)   (no calendar connectors yet -> null)
 *
 * `serve(handler)` replaces `Deno.serve(handler)`: it adds CORS for the browser app, checks the
 * caller (signed-in user, or the scheduled-job secret), and turns crashes into JSON errors.
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createEntities, Base44Error, normalizeRecord, fromPgError } from './b44/entities.js';
import { SCHEMA } from './b44/schema.generated.js';
import { functionSlug } from './b44/functionSlug.js';
import { invokeLLM } from './llm.ts';
import { sendEmail } from './email.ts';

const env = (k: string) => Deno.env.get(k) || '';

function firstKey(jsonEnv: string): string {
  try {
    const parsed = JSON.parse(env(jsonEnv) || '{}');
    return parsed.default || Object.values(parsed)[0] || '';
  } catch {
    return '';
  }
}

export const SUPABASE_URL = env('SUPABASE_URL');
// Supabase provides these automatically. Newer projects also expose the new-style keys as JSON.
export const ANON_KEY = env('SUPABASE_ANON_KEY') || firstKey('SUPABASE_PUBLISHABLE_KEYS');
export const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY') || firstKey('SUPABASE_SECRET_KEYS');

const CORS = {
  'Access-Control-Allow-Origin': env('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/** The identity used by scheduled jobs and database triggers (Base44 ran these as the app). */
export const SYSTEM_USER = Object.freeze({
  id: 'system',
  email: 'system@automation.local',
  full_name: 'System Automation',
  role: 'admin',
  status: 'active',
  is_system: true,
});

type Caller = { kind: 'cron' } | { kind: 'user'; token: string; user: Record<string, unknown> } | { kind: 'anonymous' };
const callers = new WeakMap<Request, Promise<Caller>>();

let serviceClient: SupabaseClient | null = null;
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not available to the edge function');
    serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

function bearer(req: Request): string | null {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1].trim();
  // The anon / publishable key is not a user session.
  if (!token || token === ANON_KEY) return null;
  return token;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Works out who is calling, once per request. */
export function identify(req: Request): Promise<Caller> {
  let p = callers.get(req);
  if (!p) {
    p = (async (): Promise<Caller> => {
      const cron = req.headers.get('x-cron-secret');
      const expected = env('CRON_SECRET');
      if (cron && expected && timingSafeEqual(cron, expected)) return { kind: 'cron' };
      const token = bearer(req);
      if (!token) return { kind: 'anonymous' };
      const { data, error } = await getServiceClient().auth.getUser(token);
      if (error || !data?.user) return { kind: 'anonymous' };
      return { kind: 'user', token, user: data.user as unknown as Record<string, unknown> };
    })();
    callers.set(req, p);
  }
  return p;
}

const unauthorized = () => new Base44Error('Authentication required', 401, 'UNAUTHENTICATED', { error: 'Unauthorized' });

function makeCore(client: SupabaseClient) {
  return {
    InvokeLLM: (params: Record<string, unknown>) => invokeLLM(params),
    SendEmail: (params: { to: string; subject: string; body: string; from_name?: string }) => sendEmail(params),
    async CreateFileSignedUrl({ file_uri, expires_in = 300 }: { file_uri: string; expires_in?: number }) {
      const clean = String(file_uri || '').replace(/^\/+/, '');
      const i = clean.indexOf('/');
      const bucket = clean.slice(0, i);
      const path = clean.slice(i + 1);
      const { data, error } = await getServiceClient().storage.from(bucket).createSignedUrl(path, Number(expires_in) || 300);
      if (error) throw new Base44Error(error.message, 400, 'SIGNED_URL_FAILED', { error: error.message });
      return { signed_url: data.signedUrl };
    },
    async UploadFile({ file }: { file: File | Blob & { name?: string } }) {
      const path = `uploads/server/${crypto.randomUUID()}-${(file as File).name || 'file'}`;
      const { error } = await client.storage.from('public-files').upload(path, file, { contentType: file.type || undefined });
      if (error) throw new Base44Error(error.message, 400, 'UPLOAD_FAILED', {});
      return { file_url: client.storage.from('public-files').getPublicUrl(path).data.publicUrl };
    },
  };
}

const connectors = {
  // Base44 managed the Google Calendar / Outlook sign-in. Not available yet after the move.
  async getConnection(_type: string) {
    throw new Base44Error('No calendar is connected', 404, 'NOT_CONNECTED', {});
  },
};

/** Drop-in for `createClientFromRequest(req)` from 'npm:@base44/sdk'. Loosely typed, like the SDK. */
// deno-lint-ignore no-explicit-any
export function createClientFromRequest(req: Request): any {
  const callerP = identify(req);
  const service = getServiceClient();
  const serviceEntities = createEntities({ supabase: service, schema: SCHEMA, hooks: { deleteRow: deleteAuthUserHook } });

  // Entities "as the user": a client that sends the user's own token, so row level security applies.
  // Built once we know the caller; until then each call waits for it.
  let userEntities: Record<string, Record<string, (...a: unknown[]) => unknown>> | null = null;
  const lazyEntities = new Proxy({} as Record<string, unknown>, {
    get(_t, name) {
      if (typeof name !== 'string' || name === 'then') return undefined;
      if (userEntities) return userEntities[name];
      return new Proxy({} as Record<string, unknown>, {
        get(_h, method) {
          if (typeof method !== 'string' || method === 'then') return undefined;
          return async (...args: unknown[]) => {
            await ready;
            return userEntities![name][method](...args);
          };
        },
      });
    },
  });

  const ready = callerP.then((caller) => {
    if (caller.kind === 'user') {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${caller.token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      userEntities = createEntities({ supabase: userClient, schema: SCHEMA }) as typeof userEntities;
    } else if (caller.kind === 'cron') {
      userEntities = serviceEntities as typeof userEntities;
    } else {
      // Not signed in: same as Base44, reads fail with "permission denied" through RLS.
      userEntities = createEntities({
        supabase: createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }),
        schema: SCHEMA,
      }) as typeof userEntities;
    }
    return caller;
  });

  const auth = {
    async me() {
      const caller = await ready;
      if (caller.kind === 'cron') return { ...SYSTEM_USER };
      if (caller.kind !== 'user') throw unauthorized();
      const { data, error, status } = await service.from('users').select('*').eq('id', caller.user.id).maybeSingle();
      if (error) throw fromPgError(error, status);
      if (!data) throw new Base44Error('User not registered for this app', 403, 'user_not_registered', {});
      if (data.status === 'suspended' || data.status === 'pending') {
        throw new Base44Error('This account does not have access', 403, 'user_not_registered', {});
      }
      return { ...normalizeRecord(data), email: data.email || caller.user.email };
    },
    async isAuthenticated() {
      const caller = await ready;
      return caller.kind === 'cron' || caller.kind === 'user';
    },
  };

  const base44 = {
    auth,
    entities: lazyEntities,
    integrations: { Core: makeCore(service) },
    asServiceRole: {
      entities: serviceEntities,
      integrations: { Core: makeCore(service) },
      connectors,
      supabase: service,
    },
    functions: {
      /** Call another edge function as the same caller. */
      async invoke(name: string, payload: unknown = {}) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: ANON_KEY };
        const caller = await ready;
        if (caller.kind === 'user') headers.Authorization = `Bearer ${caller.token}`;
        if (caller.kind === 'cron') headers['x-cron-secret'] = env('CRON_SECRET');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionSlug(name)}`, { method: 'POST', headers, body: JSON.stringify(payload) });
        const text = await res.text();
        let data: unknown = text;
        try { data = text ? JSON.parse(text) : null; } catch { /* text */ }
        if (!res.ok) throw Object.assign(new Error(`Request failed with status code ${res.status}`), { status: res.status, response: { status: res.status, data } });
        return { data, status: res.status };
      },
    },
  };
  ready.catch(() => {});
  return base44;
}

/** Deleting a User row means deleting the Supabase Auth user (the users row goes with it). */
async function deleteAuthUserHook(entity: string, id: string) {
  if (entity !== 'User') return null;
  const { error } = await getServiceClient().auth.admin.deleteUser(id);
  if (error) throw new Base44Error(error.message, 400, 'DELETE_USER_FAILED', {});
  return { success: true };
}

type Handler = (req: Request) => Response | Promise<Response>;

/**
 * Replaces Deno.serve(handler).
 * options.public: callable without signing in (the public membership form).
 */
export function serve(handler: Handler, options: { public?: boolean } = {}) {
  return Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    try {
      if (!options.public) {
        const caller = await identify(req);
        if (caller.kind === 'anonymous') {
          return withCors(Response.json({ error: 'Please sign in again.' }, { status: 401 }));
        }
      }
      return withCors(await handler(req));
    } catch (error) {
      console.error(error);
      const status = (error as { status?: number })?.status;
      return withCors(Response.json({ error: (error as Error)?.message || 'Server error' }, { status: status && status >= 400 ? status : 500 }));
    }
  });
}

function withCors(res: Response) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
