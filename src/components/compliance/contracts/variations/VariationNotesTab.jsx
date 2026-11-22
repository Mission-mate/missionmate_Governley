import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';
import { VARIATION_OBJECT_TYPE } from '@/lib/contractVariations';

const loadNote = async (id) => (await listNotePages(VARIATION_OBJECT_TYPE, id))[0] || null;

/** Single Notes page for one contract variation. */
export default function VariationNotesTab({ variation, readOnly, onDirtyChange, actionsRef }) {
  return (
    <SinglePageDocument
      key={variation.id}
      objectType={VARIATION_OBJECT_TYPE}
      objectId={variation.id}
      queryKey={['notePages', VARIATION_OBJECT_TYPE, variation.id, 'single']}
      loadPage={loadNote}
      defaultTitle="Notes"
      breadcrumbRoot={variation.title || 'Variation'}
      flush
      readOnly={readOnly}
      onDirtyChange={onDirtyChange}
      actionsRef={actionsRef}
      errorLabel="notes"
    />
  );
}