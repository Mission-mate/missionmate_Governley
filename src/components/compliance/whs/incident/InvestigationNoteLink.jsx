import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import RailBadgeIcon from '@/components/shared/RailBadgeIcon';
import { base44 } from '@/api/base44Client';
import NotePagePane from '@/components/notes/NotePagePane';
import { createNotePage, updateNotePage } from '@/lib/notePages';

const OBJECT_TYPE = 'whs_incident_investigation';
const TITLE = 'Investigation Summary';
const HINT = 'Summarise the investigation findings, evidence gathered and contributing factors';

/** Single Investigation Summary note page for an incident, opened in a side pane. */
export default function InvestigationNoteLink({ incidentId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const key = ['investigationNote', incidentId];
  const { data: note = null } = useQuery({
    queryKey: key,
    queryFn: async () => (await base44.entities.NotePage.filter({ object_type: OBJECT_TYPE, object_id: incidentId }, 'created_date', 1))[0] || null,
  });

  const save = async (draft) => {
    const values = { ...draft, title: draft.title.trim() || TITLE };
    if (note) await updateNotePage(note.id, values);
    else await createNotePage(OBJECT_TYPE, incidentId, values);
    await qc.invalidateQueries({ queryKey: key });
  };

  return (
    <div className="mt-5 pt-4 border-t border-border">
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-colors">
        <RailBadgeIcon icon={FileText} tone="blue" /> {TITLE}
      </button>
      <NotePagePane isOpen={open} note={note} hint={HINT} defaultTitle={TITLE}
        onClose={() => setOpen(false)} onSave={save} />
    </div>
  );
}