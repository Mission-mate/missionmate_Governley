import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { readClientToday } from '../_shared/clientDate.ts';
import { calcExpirationDate } from '../_shared/membershipExpiration.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';
import { clientIp } from '../_shared/clientIp.ts';

// Generic response for anything blocked by anti-abuse checks — never reveals
// which protection tripped.
const BLOCKED = () => Response.json({ error: 'Something went wrong.' }, { status: 400 });

// System member field keys that live as first-class Member attributes.
const SYSTEM_MEMBER_KEYS = [
  'first_name', 'last_name', 'email', 'phone', 'organisation',
  'street_address', 'suburb', 'state', 'postal_code',
];

// Fee types that mean no money is owed — these plans leave payment_status empty.
const FREE_FEE_TYPES = ['Free', 'No Membership Fee'];

// Whether a field is shown for the selected plan (mirrors isFieldVisibleForPlan).
function visibleForPlan(field, planId) {
  const plans = field?.visibility_plans;
  if (!Array.isArray(plans) || plans.length === 0) return true;
  return !!planId && plans.includes(planId);
}

// Public, unauthenticated endpoint. Accepts a membership form submission,
// creates a Member record, saves the full application response history, and
// writes mapped custom answers to the member profile.
serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { slug = 'default', values = {}, custom_fields = {}, structure_id, tier_id = '', payment_method = '', online_payment_type = '', fee_amount } = body;

    // Honeypot first — caught bots get silent success and never consume a
    // throttle slot (keeps the limiter's map clean for real traffic).
    if (body.website) return Response.json({ success: true });

    // Per-IP throttle, applied before any database work.
    if (!checkRateLimit(clientIp(req), { max: 5, windowMs: 60 * 60 * 1000 }).allowed) {
      return BLOCKED();
    }

    const configs = await base44.asServiceRole.entities.MembershipFormConfig.filter({ slug });
    const config = configs[0] || null;
    if (!config || config.status === 'disabled') {
      return Response.json({ error: 'This membership form is not currently accepting submissions.' }, { status: 403 });
    }

    const firstName = (values.first_name || '').trim();
    const lastName = (values.last_name || '').trim();
    if (!firstName || !lastName) {
      return Response.json({ error: 'First name and last name are required.' }, { status: 400 });
    }

    const exposed = config.selected_structure_ids || [];
    let structure = null;
    if (structure_id && exposed.includes(structure_id)) {
      structure = await base44.asServiceRole.entities.MembershipStructure.get(structure_id).catch(() => null);
    }
    if (!structure) {
      return Response.json({ error: 'Please select a valid membership plan.' }, { status: 400 });
    }

    // Load member custom field definitions (for labels + validation).
    const cfRecords = await base44.asServiceRole.entities.AppConfig.filter({ key: 'custom_fields' });
    const memberCustomFields = cfRecords[0]?.settings?.membership || [];
    const customById = {};
    for (const cf of memberCustomFields) customById[cf.id] = cf;

    // The global form layout drives which questions apply. Only fields that are
    // enabled and visible for the chosen plan are processed.
    const layout = (config.field_layout || []).filter(
      (f) => f.enabled && !f.hidden && visibleForPlan(f, structure.id)
    );

    const answersLog = [];
    const mappedSystem = {};        // custom answers mapped to system columns
    const finalCustom = {};         // custom answers kept on the member

    for (const f of layout) {
      const isCustom = f.kind === 'custom';
      const rawValue = isCustom ? custom_fields[f.field_id] : values[f.field_id];

      // Required validation.
      if (f.mandatory) {
        const empty = rawValue == null || rawValue === '' || (Array.isArray(rawValue) && rawValue.length === 0);
        if (empty) return Response.json({ error: `${f.label || 'A required question'} is required.` }, { status: 400 });
      }

      // Response history — every enabled/visible question, mapped or not.
      answersLog.push({
        question_id: f.field_id,
        label: f.label || '',
        type: isCustom ? (customById[f.field_id]?.type || f.type || 'Custom') : 'System',
        value: rawValue ?? '',
        mapped_to: isCustom ? (f.map_to_field || '') : f.field_id,
      });

      if (!isCustom) continue; // system fields are handled below from `values`

      // Custom field: map to a member profile field if configured.
      if (f.map_to_field && rawValue != null && rawValue !== '') {
        if (SYSTEM_MEMBER_KEYS.includes(f.map_to_field)) {
          mappedSystem[f.map_to_field] = rawValue;
        } else if (customById[f.map_to_field]) {
          finalCustom[f.map_to_field] = rawValue;
        } else {
          finalCustom[f.field_id] = rawValue; // mapped target gone — keep under own id
        }
      } else if (rawValue != null && rawValue !== '') {
        finalCustom[f.field_id] = rawValue;
      }
    }

    // Membership starts on the organisation's calendar date, not the server's UTC date.
    // Start date = the applicant's device day (validated to within a day of UTC).
    const startDate = readClientToday(body);
    if (!startDate) return BLOCKED();
    const expiration = calcExpirationDate(startDate, structure);

    // Resolve the chosen tier (if any) for logging & notes.
    const tier = (Array.isArray(structure.tiers) ? structure.tiers : []).find((t) => t.id === tier_id) || null;
    const onlineType = payment_method === 'Online Payment' && (online_payment_type === 'one_time' || online_payment_type === 'recurrent')
      ? online_payment_type
      : '';
    const paymentLabel = payment_method === 'Online Payment' && onlineType
      ? `Online Payment (${onlineType === 'recurrent' ? 'Recurrent' : 'One-time'})`
      : payment_method;
    const submissionMeta = [
      tier ? `Category: ${tier.name}` : '',
      paymentLabel ? `Payment method: ${paymentLabel}` : '',
      (fee_amount != null && fee_amount !== '') ? `Fee due: $${Number(fee_amount).toFixed(2)}` : '',
    ].filter(Boolean).join(' | ');
    const combinedNotes = [(values.notes || '').trim(), submissionMeta].filter(Boolean).join('\n');

    // Paid plans start as payment 'Pending' so unpaid members are reportable;
    // free plans owe nothing and keep payment_status empty.
    const requiresPayment = !FREE_FEE_TYPES.includes(structure.fee_type || 'Free');

    const member = await base44.asServiceRole.entities.Member.create({
      first_name: firstName,
      last_name: lastName,
      email: (values.email || '').trim(),
      phone: (values.phone || '').trim(),
      organisation: (values.organisation || '').trim(),
      street_address: (values.street_address || '').trim(),
      suburb: (values.suburb || '').trim(),
      state: (values.state || '').trim(),
      postal_code: (values.postal_code || '').trim(),
      membership_structure_id: structure.id,
      membership_structure_name: structure.name || '',
      membership_tier_id: tier?.id || '',
      membership_tier_name: tier?.name || '',
      payment_method: payment_method || '',
      online_payment_type: onlineType,
      payment_status: requiresPayment ? 'Pending' : '',
      status: 'pending',
      start_date: startDate,
      expiration_date: expiration,
      notes: combinedNotes,
      // Mapped custom answers overwrite system columns automatically.
      ...mappedSystem,
      custom_fields: finalCustom,
    });

    // Save the full submission history regardless of mapping.
    await base44.asServiceRole.entities.MembershipApplicationResponse.create({
      membership_structure_id: structure.id,
      membership_structure_name: structure.name || '',
      member_id: member.id,
      member_name: `${firstName} ${lastName}`.trim(),
      answers: answersLog,
      submitted_at: new Date().toISOString(),
    });

    return Response.json({ success: true, member_id: member.id });
  } catch (error) {
    // Public endpoint — log internally, never surface implementation details.
    console.error('submitMembershipForm failed:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}, { public: true });