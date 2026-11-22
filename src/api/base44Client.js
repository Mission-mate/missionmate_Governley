/**
 * Drop-in replacement for the Base44 SDK client, built on Supabase.
 *
 * Every screen imports `base44` from here exactly as before:
 *   base44.entities.<Name>.*          -> Postgres tables (supabase/functions/_shared/b44/entities.js)
 *   base44.auth.*                     -> Supabase Auth (email + password, Google, Microsoft Entra ID)
 *   base44.functions.invoke(name, …)  -> Supabase Edge Functions (supabase/functions/<name-with-hyphens>)
 *   base44.integrations.Core.*        -> Supabase Storage + the invokeLLM edge function
 *   base44.users.inviteUser(…)        -> adminUsers edge function
 */
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';
import { createEntities, Base44Error, fromPgError, normalizeRecord } from '@b44/entities.js';
import { SCHEMA } from '@b44/schema.generated.js';
import { functionSlug } from '@b44/functionSlug.js';

export { supabase };

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

// ---------------------------------------------------------------------------- functions

/**
 * Same result shape as the Base44 SDK (axios): resolves { data, status, headers };
 * on an error status it throws an error with .response = { status, data }.
 */
async function invoke(name, payload = {}) {
  if (typeof payload === 'string') {
    throw new Error(`Function ${name} must receive an object with named parameters, received: ${payload}`);
  }
  const session = await currentSession();
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
  };
  let body;
  const hasFile = payload && Object.values(payload).some((v) => typeof File !== 'undefined' && v instanceof File);
  if (payload instanceof FormData || hasFile) {
    body = payload instanceof FormData ? payload : new FormData();
    if (!(payload instanceof FormData)) {
      for (const [k, v] of Object.entries(payload)) {
        if (v instanceof File) body.append(k, v, v.name);
        else if (v !== null && typeof v === 'object') body.append(k, JSON.stringify(v));
        else if (v !== undefined) body.append(k, v);
      }
    }
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload ?? {});
  }

  let res;
  try {
    // invoke('deleteMeeting') -> /functions/v1/delete-meeting
    res = await fetch(`${SUPABASE_URL}/functions/v1/${functionSlug(name)}`, { method: 'POST', headers, body });
  } catch (networkError) {
    const err = new Error(`Network error calling ${name}: ${networkError.message}`);
    err.response = undefined;
    throw err;
  }
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* plain text response */
  }
  if (!res.ok) {
    const err = new Error(`Request failed with status code ${res.status}`);
    err.status = res.status;
    err.data = data;
    err.response = { status: res.status, data, headers: res.headers };
    throw err;
  }
  return { data, status: res.status, headers: res.headers };
}

// ---------------------------------------------------------------------------- entities

const entities = createEntities({
  supabase,
  schema: SCHEMA,
  hooks: {
    // Removing a team member deletes their login too, which needs the service role.
    async deleteRow(entity, id) {
      if (entity !== 'User') return null;
      await invoke('adminUsers', { action: 'delete', user_id: id });
      return { success: true };
    },
  },
});

// ---------------------------------------------------------------------------- auth

const authError = (error, fallback) =>
  new Base44Error(error?.message || fallback, error?.status || 400, error?.code, { message: error?.message || fallback });

const PROVIDERS = { google: 'google', microsoft: 'azure', azure: 'azure', sso: 'azure', apple: 'apple', facebook: 'facebook' };

const auth = {
  /** The signed-in team member (row from public.users), like Base44 auth.me(). */
  async me() {
    const session = await currentSession();
    if (!session) throw new Base44Error('Authentication required', 401, 'UNAUTHENTICATED', { extra_data: { reason: 'auth_required' } });
    const { data, error, status } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw fromPgError(error, status);
    if (!data) {
      throw new Base44Error('User not registered for this app', 403, 'user_not_registered', {
        extra_data: { reason: 'user_not_registered' },
      });
    }
    if (data.status === 'pending' || data.status === 'suspended') {
      // Signed up on their own (waiting for an admin) or suspended: show "Access Restricted".
      throw new Base44Error('Your account is waiting for an administrator to give you access', 403, 'user_not_registered', {
        extra_data: { reason: 'user_not_registered' },
      });
    }
    return { ...normalizeRecord(data), email: data.email || session.user.email };
  },

  async isAuthenticated() {
    return !!(await currentSession());
  },

  async updateMe(patch) {
    const session = await currentSession();
    if (!session) throw new Base44Error('Authentication required', 401, 'UNAUTHENTICATED', {});
    return entities.User.update(session.user.id, patch);
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw authError(error, 'Invalid email or password');
    return { access_token: data.session?.access_token, user: data.user };
  },

  /** provider: 'google' | 'microsoft' (Microsoft Entra ID / Azure AD) */
  async loginWithProvider(provider, fromUrl = '/') {
    const p = PROVIDERS[provider] || provider;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: p,
      options: {
        redirectTo: new URL(fromUrl || '/', origin()).href,
        // Entra ID only returns the email address when the "email" scope is asked for.
        ...(p === 'azure' ? { scopes: 'email' } : {}),
      },
    });
    if (error) throw authError(error, 'Could not start sign-in');
  },

  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin()}/`, ...(full_name ? { data: { full_name } } : {}) },
    });
    if (error) throw authError(error, 'Registration failed');
    // When "Confirm email" is turned off in Supabase there is a session straight away.
    return { user: data.user, session: data.session, access_token: data.session?.access_token || null };
  },

  /** The 6-digit code from the sign-up email. */
  async verifyOtp({ email, otpCode }) {
    let res = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
    if (res.error) res = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
    if (res.error) throw authError(res.error, 'Invalid verification code');
    return { access_token: res.data.session?.access_token || null, user: res.data.user };
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${origin()}/` } });
    if (error) throw authError(error, 'Failed to resend code');
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/reset-password` });
    if (error) throw authError(error, 'Could not send the reset email');
  },

  /**
   * Called on /reset-password after the user opened the link from the email.
   * resetToken is the token_hash from the email link (works on any device), or
   * "supabase-recovery" when Supabase already signed the user in from the link.
   * type is "recovery" (forgot password) or "invite" (invited member picks a password).
   */
  async resetPassword({ resetToken, newPassword, type = 'recovery' }) {
    let session = await currentSession();
    if (resetToken && resetToken !== 'supabase-recovery') {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash: resetToken, type: type === 'invite' ? 'invite' : 'recovery' });
      // A second try (e.g. after a too-short password) re-uses the session from the first one.
      if (!error) session = data.session;
      else if (!session) throw authError(error, 'This reset link has expired. Please request a new one.');
    }
    if (!session) {
      throw new Base44Error('This reset link has expired. Please request a new one.', 401, 'RESET_EXPIRED', {});
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(error, 'Failed to reset password');
    await supabase.auth.signOut();
  },

  /** Signs out and goes to the login page (Base44 also always redirected). */
  async logout() {
    await supabase.auth.signOut().catch(() => {});
    if (typeof window !== 'undefined') window.location.href = '/login';
  },

  redirectToLogin() {
    if (typeof window !== 'undefined') window.location.href = '/login';
  },

  // Supabase stores and refreshes the session itself; kept so old calls don't break.
  setToken() {},
};

// ---------------------------------------------------------------------------- storage + AI

const safeName = (name) => (name || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120);
const newPath = (file) => {
  const d = new Date();
  const id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 13);
  return `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${id}-${safeName(file?.name)}`;
};

async function upload(bucket, file) {
  if (!file) throw new Base44Error('No file given', 400, 'NO_FILE', {});
  const path = newPath(file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Base44Error(error.message || 'Upload failed', error.statusCode ? Number(error.statusCode) : 400, 'UPLOAD_FAILED', {});
  return path;
}

/** "private-files/uploads/…" -> { bucket, path } */
export function parseFileUri(uri) {
  const clean = String(uri || '').replace(/^\/+/, '');
  const i = clean.indexOf('/');
  return { bucket: clean.slice(0, i), path: clean.slice(i + 1) };
}

const Core = {
  /** Public file (logos, pictures). Returns { file_url } — a permanent public link. */
  async UploadFile({ file }) {
    const path = await upload('public-files', file);
    const { data } = supabase.storage.from('public-files').getPublicUrl(path);
    return { file_url: data.publicUrl };
  },

  /** Private file. Returns { file_uri } to keep on the record; open it with CreateFileSignedUrl. */
  async UploadPrivateFile({ file }) {
    const path = await upload('private-files', file);
    return { file_uri: `private-files/${path}` };
  },

  async CreateFileSignedUrl({ file_uri, expires_in = 300 }) {
    const { bucket, path } = parseFileUri(file_uri);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, Number(expires_in) || 300);
    if (error) throw new Base44Error(error.message || 'Could not create a link', 400, 'SIGNED_URL_FAILED', {});
    return { signed_url: data.signedUrl };
  },

  /** AI call through the invokeLLM edge function. Returns text, or an object when response_json_schema is given. */
  async InvokeLLM(params) {
    const res = await invoke('invokeLLM', params);
    return res.data?.result;
  },

  async SendEmail() {
    throw new Base44Error('Emails are sent from edge functions, not from the browser', 400, 'NOT_SUPPORTED', {});
  },
};

// ---------------------------------------------------------------------------- export

export const base44 = {
  entities,
  auth,
  functions: { invoke },
  integrations: { Core },
  users: {
    /** Sends a Supabase invite email. profile: optional { first_name, last_name }. */
    async inviteUser(email, role = 'user', profile = {}) {
      const res = await invoke('adminUsers', { action: 'invite', email, role, ...profile, redirect_to: `${origin()}/` });
      return res.data;
    },
  },
  // Base44 analytics/log helpers are not used any more; kept as no-ops so nothing crashes.
  appLogs: { async logUserInApp() {} },
  analytics: { track() {} },
};

export default base44;