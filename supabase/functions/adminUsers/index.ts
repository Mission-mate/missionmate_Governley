/**
 * adminUsers — team member actions that need the service role key (new, replaces Base44 users API).
 * Admins only.
 *   { action: 'invite', email, role?, first_name?, last_name?, redirect_to? }  -> sends a Supabase invite email
 *   { action: 'delete', user_id }                                              -> removes the login and the team member
 */
import { createClientFromRequest, getServiceClient, serve } from '../_shared/base44.ts';

const ROLES = ['admin', 'user', 'guest', 'owner'];

serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const me = await base44.auth.me().catch(() => null);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (me.role !== 'admin' && me.role !== 'owner') return Response.json({ error: 'Only admins can manage the team' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const svc = getServiceClient();

  if (body.action === 'invite') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: 'A valid email is required' }, { status: 400 });
    const role = ROLES.includes(body.role) ? body.role : 'user';
    if (role === 'owner' && me.role !== 'owner') return Response.json({ error: 'Only an owner can invite an owner' }, { status: 403 });

    // The invite email template sends people to /reset-password to choose a password (see README).
    const site = Deno.env.get('SITE_URL') || body.redirect_to || undefined;
    const first_name = typeof body.first_name === 'string' ? body.first_name.trim() : '';
    const last_name = typeof body.last_name === 'string' ? body.last_name.trim() : '';
    const { data, error } = await svc.auth.admin.inviteUserByEmail(email, {
      redirectTo: site,
      data: { first_name, last_name, full_name: `${first_name} ${last_name}`.trim() },
    });

    let userId = data?.user?.id;
    if (error) {
      // Already has a login (e.g. signed up on their own and is waiting, status 'pending'):
      // adding them here is how an admin gives them access.
      const { data: existing } = await svc.from('users').select('id, status').eq('email', email).maybeSingle();
      if (!existing) return Response.json({ error: error.message }, { status: 400 });
      userId = existing.id;
      const patch: Record<string, unknown> = { role, status: 'active' };
      if (first_name) patch.first_name = first_name;
      if (last_name) patch.last_name = last_name;
      await svc.from('users').update(patch).eq('id', userId);
      return Response.json({ ok: true, already_registered: true, user_id: userId });
    }

    const patch: Record<string, unknown> = { role, status: 'invited' };
    if (first_name) patch.first_name = first_name;
    if (last_name) patch.last_name = last_name;
    if (first_name || last_name) patch.full_name = `${first_name} ${last_name}`.trim();
    await svc.from('users').update(patch).eq('id', userId);
    return Response.json({ ok: true, user_id: userId });
  }

  if (body.action === 'delete') {
    const id = String(body.user_id || '');
    if (!id) return Response.json({ error: 'user_id is required' }, { status: 400 });
    if (id === me.id) return Response.json({ error: 'You cannot remove yourself' }, { status: 400 });
    const { error } = await svc.auth.admin.deleteUser(id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});
