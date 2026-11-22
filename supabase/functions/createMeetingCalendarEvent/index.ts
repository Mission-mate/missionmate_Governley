import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { getOrgTimezone } from '../_shared/orgClock.ts';

/**
 * Creates a calendar event for a newly scheduled board meeting.
 * Triggered by an entity automation on Meeting create.
 * Uses whichever calendar connector is authorized (Google Calendar preferred, then Outlook).
 */
serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Resolve the meeting — either from the automation payload or a direct meeting_id.
    let meeting = body?.data || null;
    const meetingId = body?.event?.entity_id || body?.meeting_id || meeting?.id;
    if ((!meeting || body?.payload_too_large) && meetingId) {
      meeting = await base44.asServiceRole.entities.Meeting.get(meetingId);
    }
    if (!meeting) return Response.json({ error: 'Meeting not found' }, { status: 404 });
    if (meeting.status === 'cancelled') return Response.json({ skipped: 'cancelled' });

    // Build start/end datetimes from the meeting date + times (times are HH:mm).
    const date = meeting.meeting_date;
    const start = `${date}T${(meeting.start_time || '09:00')}:00`;
    const end = `${date}T${(meeting.end_time || meeting.start_time || '10:00')}:00`;
    // Meeting times are organisation wall-clock times — book them in the org's zone.
    const timeZone = await getOrgTimezone(base44);
    const locationParts = [meeting.location, meeting.address].filter(Boolean);
    const location = meeting.meeting_type === 'online'
      ? (meeting.video_link || meeting.meeting_link || '')
      : locationParts.join(', ');
    const description = [
      meeting.committee_name ? `Committee: ${meeting.committee_name}` : '',
      meeting.meeting_link ? `Meeting link: ${meeting.meeting_link}` : '',
      meeting.video_link ? `Video link: ${meeting.video_link}` : '',
    ].filter(Boolean).join('\n');

    // Try Google Calendar first.
    const google = await tryGetConnection(base44, 'googlecalendar');
    if (google) {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${google}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: meeting.title,
            description,
            location,
            start: { dateTime: start, timeZone },
            end: { dateTime: end, timeZone },
          }),
        }
      );
      if (!res.ok) return Response.json({ error: `Google Calendar error: ${await res.text()}` }, { status: 502 });
      const created = await res.json();
      return Response.json({ provider: 'googlecalendar', event_id: created.id });
    }

    // Fall back to Outlook.
    const outlook = await tryGetConnection(base44, 'outlook');
    if (outlook) {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${outlook}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: meeting.title,
          body: { contentType: 'text', content: description },
          location: { displayName: location },
          start: { dateTime: start, timeZone },
          end: { dateTime: end, timeZone },
        }),
      });
      if (!res.ok) return Response.json({ error: `Outlook error: ${await res.text()}` }, { status: 502 });
      const text = await res.text();
      const created = text ? JSON.parse(text) : {};
      return Response.json({ provider: 'outlook', event_id: created.id });
    }

    return Response.json({ skipped: 'no_calendar_connected' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function tryGetConnection(base44, type) {
  try {
    const conn = await base44.asServiceRole.connectors.getConnection(type);
    return conn?.accessToken || null;
  } catch (_e) {
    return null;
  }
}