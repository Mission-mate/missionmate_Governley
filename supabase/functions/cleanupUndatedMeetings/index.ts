import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cascadeDeleteMeeting } from '../_shared/meetingCascade.ts';

/**
 * One-time (safe to re-run) cleanup that removes legacy "draft" meetings — any
 * Meeting saved without a meeting_date, before date and start/end time became
 * mandatory at creation. Such records could otherwise sit in the Upcoming tab
 * forever.
 *
 * Each meeting goes through the shared cascade, so participants and action
 * register links are removed too. A meeting with documents still attached is
 * reported as skipped rather than deleted — governance records must never be
 * silently lost.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole.entities;

    const all = await svc.Meeting.list();
    const undated = all.filter((m: any) => {
      const d = m?.meeting_date;
      return !d || String(d).trim() === '' || isNaN(new Date(d).getTime());
    });

    const deleted: string[] = [];
    const skipped: { id: string; title?: string; reason: string; document_count?: number }[] = [];

    for (const meeting of undated) {
      const result = await cascadeDeleteMeeting(svc, meeting.id);
      if (result.ok) {
        deleted.push(meeting.id);
      } else {
        skipped.push({
          id: meeting.id,
          title: meeting.title,
          reason: result.reason,
          document_count: result.reason === 'documents_attached' ? result.document_count : undefined,
        });
      }
    }

    return Response.json({
      ok: true,
      scanned: all.length,
      undated_found: undated.length,
      deleted_count: deleted.length,
      deleted,
      skipped,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
