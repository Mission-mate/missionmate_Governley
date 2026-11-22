/**
 * Member notification emails (backend).
 *
 * Subject/body copy comes from the admin-editable Email Templates tab
 * (AppConfig record `membership_email_templates`), falling back to the same
 * default copy the frontend shows in src/lib/emailTemplates.js.
 */

const TEMPLATES_CONFIG_KEY = 'membership_email_templates';

const DEFAULTS = {
  renewal_reminder: {
    subject: 'Time to renew your membership',
    body:
      'Hi {first_name},\n\nThis is a reminder that your membership is set to expire on {expiration_date} and up for renewal. Please renew to keep your membership active with us.\n\nPlease send your membership enquiries to {membership_supportemail}\n\nBest regards,\nThe Team',
  },
  expiry_reminder: {
    subject: 'Your membership has expired',
    body:
      'Hi {first_name},\n\nThis is a friendly reminder that your membership has expired on {expiration_date}.\n\nPlease renew to keep your benefits active. Please send your membership enquiries to {membership_supportemail}\n\nBest regards,\nThe Team',
  },
};

/**
 * Load the saved templates plus the organisation's support email once per run.
 * Always resolves — falls back to the built-in defaults.
 */
export async function loadEmailContext(base44) {
  let saved = {};
  let supportEmail = '';
  try {
    const records = await base44.asServiceRole.entities.AppConfig.filter({ key: TEMPLATES_CONFIG_KEY });
    saved = records?.[0]?.settings || {};
  } catch {
    saved = {};
  }
  try {
    const forms = await base44.asServiceRole.entities.MembershipFormConfig.filter({ slug: 'default' });
    supportEmail = forms?.[0]?.support_email || '';
  } catch {
    supportEmail = '';
  }
  return { saved, supportEmail };
}

/** Resolve subject/body for a template id, applying member placeholders. */
export function renderTemplate(templateId, ctx, member, fee) {
  const def = DEFAULTS[templateId];
  const savedTpl = ctx.saved?.[templateId] || {};
  const values = {
    '{first_name}': member.first_name || 'there',
    '{expiration_date}': member.expiration_date || '',
    '{membership_supportemail}': ctx.supportEmail || '',
    '{membership_fees}': fee || '',
  };
  const apply = (text) =>
    Object.keys(values).reduce((out, key) => out.split(key).join(values[key]), String(text || ''));

  return {
    subject: apply(savedTpl.subject ?? def.subject),
    body: apply(savedTpl.body ?? def.body),
  };
}