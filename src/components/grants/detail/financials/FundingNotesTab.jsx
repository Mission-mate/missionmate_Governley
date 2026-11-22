import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';

const OBJECT_TYPE = 'grant_funding_entry';

const loadFundingNote = async (entryId) => (await listNotePages(OBJECT_TYPE, entryId))[0] || null;

/** Single Notes page for one funding row, shown in the entry pane's Notes tab. */
export default function FundingNotesTab({ entry, readOnly = false, onDirtyChange }) {
  return (
    <SinglePageDocument
      key={entry.id}
      objectType={OBJECT_TYPE}
      objectId={entry.id}
      queryKey={['notePages', OBJECT_TYPE, entry.id, 'single']}
      loadPage={loadFundingNote}
      defaultTitle="Notes"
      breadcrumbRoot={entry.label || 'Funding Schedule'}
      flush
      readOnly={readOnly}
      onDirtyChange={onDirtyChange}
      errorLabel="notes"
    />
  );
}