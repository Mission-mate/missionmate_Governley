import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';

export const RP_OBJECT_TYPE = 'responsible_person';

const loadNote = async (id) => (await listNotePages(RP_OBJECT_TYPE, id))[0] || null;

/** Single Notes page (no page rail) for one responsible person. */
export default function ResponsiblePersonNotesTab({ person, readOnly, onDirtyChange, actionsRef }) {
  return (
    <SinglePageDocument
      key={person.id}
      objectType={RP_OBJECT_TYPE}
      objectId={person.id}
      queryKey={['notePages', RP_OBJECT_TYPE, person.id, 'single']}
      loadPage={loadNote}
      defaultTitle="Notes"
      breadcrumbRoot={person.full_name || 'Committee Member'}
      flush
      readOnly={readOnly}
      onDirtyChange={onDirtyChange}
      actionsRef={actionsRef}
      errorLabel="notes"
    />
  );
}