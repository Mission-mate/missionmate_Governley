import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { loadConflictActionPage, CONFLICT_ACTION_TYPE, ACTION_PAGE_TITLE } from '@/lib/conflictActionPage';

/** A conflict's single Action page. */
export default function ConflictActionsTab({ conflictId, breadcrumbRoot = 'Conflict of Interest', readOnly = false, flush = false, onDirtyChange, actionsRef }) {
  return (
    <SinglePageDocument
      objectType={CONFLICT_ACTION_TYPE}
      objectId={conflictId}
      queryKey={['conflictActionPage', conflictId]}
      loadPage={loadConflictActionPage}
      defaultTitle={ACTION_PAGE_TITLE}
      breadcrumbRoot={breadcrumbRoot}
      readOnly={readOnly}
      flush={flush}
      onDirtyChange={onDirtyChange}
      actionsRef={actionsRef}
      errorLabel="action"
    />
  );
}