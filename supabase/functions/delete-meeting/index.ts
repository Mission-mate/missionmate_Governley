import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cascadeDeleteMeeting } from '../_shared/meetingCascade.ts';

/**
 * Safely delete a board Meeting together with the records that only exist
 * because of it. The cascade itself lives in shared/meetingCascade.ts so the
 * legacy undated-meeting cleanup removes meetings exactly the same way.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const meetingId = body?.meeting_id;
    if (!meetingId) {
      return Response.json({ error: 'meeting_id is required' }, { status: 400 });
    }

    const result = await cascadeDeleteMeeting(base44.asServiceRole.entities, meetingId);

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return Response.json({ error: 'not_found' }, { status: 404 });
      }
      return Response.json(
        {
          error: 'documents_attached',
          document_count: result.document_count,
          document_titles: result.document_titles,
        },
        { status: 409 }
      );
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
