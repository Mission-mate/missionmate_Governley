import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';
import { GIFT_OBJECT_TYPE } from '@/lib/giftRegister';

const loadNote = async (id) => (await listNotePages(GIFT_OBJECT_TYPE, id))[0] || null;

/** Single Notes page for one gift or benefit record. */
export default function GiftNotesTab({ gift, readOnly, onDirtyChange, actionsRef }) {
  return (
    <SinglePageDocument
      key={gift.id}
      objectType={GIFT_OBJECT_TYPE}
      objectId={gift.id}
      queryKey={['notePages', GIFT_OBJECT_TYPE, gift.id, 'single']}
      loadPage={loadNote}
      defaultTitle="Notes"
      breadcrumbRoot={gift.record_code || 'Gift or Benefit'}
      flush
      readOnly={readOnly}
      onDirtyChange={onDirtyChange}
      actionsRef={actionsRef}
      errorLabel="notes"
    />
  );
}