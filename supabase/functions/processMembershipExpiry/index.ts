/**
 * Nightly membership expiry sweep.
 *
 * For every member with status 'active':
 *   effective_expiry = expiration_date + plan.grace_period_days
 *   past it + plan.after_grace_period === 'Mark as expired'  -> status 'expired' (+ expiry email)
 *   past it + 'Keep active until admin review'               -> left untouched
 * Plus pre-expiry renewal reminders inside a 14-day window, deduped per cycle
 * via Member.last_renewal_reminder_date.
 *
 * Pending, expired and archived members are never touched.
 */
import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { parseIsoDate, toIsoDate } from '../_shared/membershipExpiration.ts';
import { orgClock } from '../_shared/orgClock.ts';
import { loadEmailContext, renderTemplate } from '../_shared/memberEmails.ts';

const REMINDER_WINDOW_DAYS = 14;
const PAGE_SIZE = 200;

/** Add N calendar days to a yyyy-MM-dd string, returning yyyy-MM-dd. */
function addDays(iso, days) {
  const d = parseIsoDate(iso);
  if (!d) return null;
  d.setDate(d.getDate() + (Number(days) || 0));
  return toIsoDate(d);
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled runs carry no user token. A direct human call must be an admin.
    let caller = null;
    try {
      caller = await base44.auth.me();
    } catch {
      caller = null;
    }
    if (caller && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const { today, timezone } = await orgClock(base44);
    const reminderCutoff = addDays(today, REMINDER_WINDOW_DAYS);

    const structures = await svc.entities.MembershipStructure.list('', 500);
    const planById = new Map((structures || []).map((s) => [s.id, s]));

    const counts = { processed: 0, expired: 0, kept_active: 0, skipped: 0, emails_sent: 0 };
    const toExpire = [];
    const expiryEmails = [];
    const reminderEmails = [];

    // Page through active members.
    let skip = 0;
    while (true) {
      const page = await svc.entities.Member.filter({ status: 'active' }, 'created_date', PAGE_SIZE, skip);
      const members = page || [];
      if (!members.length) break;

      for (const member of members) {
        counts.processed += 1;
        const plan = member.membership_structure_id ? planById.get(member.membership_structure_id) : null;

        if (!plan || plan.is_lifetime || !member.expiration_date) {
          counts.skipped += 1;
          continue;
        }

        const effectiveExpiry = addDays(member.expiration_date, plan.grace_period_days);
        if (!effectiveExpiry) {
          counts.skipped += 1;
          continue;
        }

        if (today > effectiveExpiry) {
          if (plan.after_grace_period === 'Keep active until admin review') {
            counts.kept_active += 1;
          } else {
            toExpire.push({ id: member.id, status: 'expired' });
            counts.expired += 1;
            if (plan.expiry_reminder_enabled && member.email) {
              expiryEmails.push({ member, plan });
            }
          }
          continue;
        }

        // Still within the term (or grace period) — consider a renewal reminder.
        const inWindow = member.expiration_date >= today && member.expiration_date < reminderCutoff;
        const alreadySent =
          member.last_renewal_reminder_date && member.last_renewal_reminder_date >= member.expiration_date;
        if (inWindow && plan.renewal_reminder_enabled && member.email && !alreadySent) {
          reminderEmails.push({ member, plan });
        }
      }

      if (members.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    // Flip statuses in batches of 500.
    for (let i = 0; i < toExpire.length; i += 500) {
      await svc.entities.Member.bulkUpdate(toExpire.slice(i, i + 500));
    }

    // Stamp reminder dates so a reminder is sent once per expiry cycle.
    const reminderStamps = reminderEmails.map((r) => ({ id: r.member.id, last_renewal_reminder_date: today }));
    for (let i = 0; i < reminderStamps.length; i += 500) {
      await svc.entities.Member.bulkUpdate(reminderStamps.slice(i, i + 500));
    }

    // Send the emails.
    if (expiryEmails.length || reminderEmails.length) {
      const ctx = await loadEmailContext(base44);
      const send = async (templateId, entry) => {
        const fee = entry.plan.fee_amount ? `$${entry.plan.fee_amount}` : '';
        const { subject, body } = renderTemplate(templateId, ctx, entry.member, fee);
        try {
          await svc.integrations.Core.SendEmail({ to: entry.member.email, subject, body });
          counts.emails_sent += 1;
        } catch (err) {
          console.error(`Failed to send ${templateId} email for member ${entry.member.id}: ${err.message}`);
        }
      };
      for (const entry of expiryEmails) await send('expiry_reminder', entry);
      for (const entry of reminderEmails) await send('renewal_reminder', entry);
    }

    console.log(
      `Membership expiry sweep (${today}, ${timezone}) — processed: ${counts.processed}, expired: ${counts.expired}, kept_active: ${counts.kept_active}, skipped: ${counts.skipped}, emails_sent: ${counts.emails_sent}`
    );

    return Response.json({ ...counts, today, timezone });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
