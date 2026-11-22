import React from 'react';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';
import { INFO_ASSET_OBJECT_TYPE } from '@/lib/infoAssetRegister';

const loadPage = async (id) => (await listNotePages(INFO_ASSET_OBJECT_TYPE, id))[0] || null;

/** An information asset's single Internal Controls notes page. */
export default function InfoControlsTab({ asset, readOnly, onDirtyChange, actionsRef }) {
  return (
    <SinglePageDocument
      objectType={INFO_ASSET_OBJECT_TYPE}
      objectId={asset.id}
      queryKey={['notePages', INFO_ASSET_OBJECT_TYPE, asset.id, 'single']}
      loadPage={loadPage}
      defaultTitle="Internal Controls"
      breadcrumbRoot={asset.title || 'Information Asset'}
      readOnly={readOnly}
      flush
      onDirtyChange={onDirtyChange}
      actionsRef={actionsRef}
      errorLabel="internal controls"
    />
  );
}