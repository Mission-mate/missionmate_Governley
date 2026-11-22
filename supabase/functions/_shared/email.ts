/**
 * Replacement for Base44 Core.SendEmail, using Resend (https://resend.com).
 * Needs RESEND_API_KEY and EMAIL_FROM in the edge function secrets.
 * Without them, emails are skipped with a warning in the function logs (nothing crashes).
 */
import { Base44Error } from './b44/entities.js';

type Email = { to: string; subject: string; body: string; from_name?: string };

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);

export async function sendEmail({ to, subject, body, from_name }: Email) {
  const key = Deno.env.get('RESEND_API_KEY');
  let from = Deno.env.get('EMAIL_FROM') || '';
  if (!key || !from) {
    console.warn(`Email to ${to} skipped: set RESEND_API_KEY and EMAIL_FROM to send emails.`);
    return { skipped: true };
  }
  if (from_name && !from.includes('<')) from = `${from_name} <${from}>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      ...(looksLikeHtml(body) ? { html: body } : { text: body }),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Base44Error(`Email could not be sent: ${text}`, 502, 'EMAIL_FAILED', { error: text });
  }
  return { sent: true };
}
