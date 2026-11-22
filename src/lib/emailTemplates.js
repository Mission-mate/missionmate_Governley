export const EMAIL_TEMPLATES_CONFIG_KEY = 'membership_email_templates';

// Variables that can be inserted into email subject/body. Order matters for display.
export const EMAIL_TEMPLATE_VARIABLES = [
  '{first_name}',
  '{membership_fees}',
  '{membership_supportemail}',
  '{expiration_date}',
];

// The four automated member emails, with their default subject/body copy.
export const EMAIL_TEMPLATE_DEFS = [
  {
    id: 'welcome',
    title: 'Welcome Email',
    subtitle: 'Welcome email to new members',
    defaultSubject: 'Welcome to our organisation!',
    defaultBody:
      'Hi {first_name},\n\nWelcome! We are thrilled to have you.\n\nPlease send your membership enquiries to {membership_supportemail}\n\nBest regards,\nThe Team',
  },
  {
    id: 'renewal_reminder',
    title: 'Renewal Reminder',
    subtitle: 'Notify members before membership expiration',
    defaultSubject: 'Time to renew your membership',
    defaultBody:
      'Hi {first_name},\n\nThis is a reminder that your membership is set to expire on {expiration_date} and up for renewal. Please renew to keep your membership active with us.\n\nPlease send your membership enquiries to {membership_supportemail}\n\nBest regards,\nThe Team',
  },
  {
    id: 'expiry_reminder',
    title: 'Expiry Reminder',
    subtitle: 'Notify members after membership expires',
    defaultSubject: 'Your membership has expired',
    defaultBody:
      'Hi {first_name},\n\nThis is a friendly reminder that your membership has expired on {expiration_date}.\n\nPlease renew to keep your benefits active. Please send your membership enquiries to {membership_supportemail}\n\nBest regards,\nThe Team',
  },
  {
    id: 'payment_reminder',
    title: 'Payment Reminder',
    subtitle: 'Payment reminders to members with membership overdues',
    defaultSubject: 'Payment reminder for your membership',
    defaultBody:
      'Hi {first_name},\n\nThis is a reminder that your membership fees of {membership_fees} are overdue. Please arrange payment to keep your membership active.\n\nPlease send your membership enquiries to {membership_supportemail}\n\nBest regards,\nThe Team',
  },
];

// Build the initial template state from saved settings, falling back to defaults.
export function buildTemplateState(saved) {
  const state = {};
  EMAIL_TEMPLATE_DEFS.forEach((def) => {
    const savedTpl = saved?.[def.id] || {};
    state[def.id] = {
      subject: savedTpl.subject ?? def.defaultSubject,
      body: savedTpl.body ?? def.defaultBody,
    };
  });
  return state;
}