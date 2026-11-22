import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { loadConflictNotesPage, NOTES_PAGE_TITLE } from '@/lib/conflictNotesPage';
import { CONFLICT_OBJECT_TYPE } from '@/lib/conflictChildCounts';

/** A conflict's single Notes page (right pane). */
export default function ConflictNotesTab({ conflictId, breadcrumbRoot, readOnly = false, flush = false, onDirtyChange, actionsRef }) {
  return (
    <SinglePageDocument
      objectType={CONFLICT_OBJECT_TYPE}
      objectId={conflictId}
      queryKey={['notePages', CONFLICT_OBJECT_TYPE, conflictId, 'single']}
      loadPage={loadConflictNotesPage}
      defaultTitle={NOTES_PAGE_TITLE}
      breadcrumbRoot={breadcrumbRoot}
      readOnly={readOnly}
      flush={flush}
      onDirtyChange={onDirtyChange}
      actionsRef={actionsRef}
      errorLabel="notes"
    />
  );
}