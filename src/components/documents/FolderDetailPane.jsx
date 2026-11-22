import React, { useRef } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import FolderDetailView from './FolderDetailView';
import FolderSummary from './FolderSummary';

/** Side pane for full-page document tabs: the folder summary in its header, the file list below. */
export default function FolderDetailPane({ folder, onClose, ...viewProps }) {
  // Keep the last folder on screen while the pane slides out.
  const shown = useRef(null);
  if (folder) shown.current = { folder, viewProps };
  const current = shown.current;

  return (
    <SlidePane isOpen={!!folder} onClose={onClose}>
      <div className="h-full bg-card flex flex-col shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
          {current && <FolderSummary folder={current.folder} docs={current.viewProps.docs} />}
          <CloseButton onClick={onClose} className="shrink-0 ml-auto" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-5 flex flex-col">
          {current &&
            <FolderDetailView key={current.folder.id} folder={current.folder} {...current.viewProps} className="flex-1" />
          }
        </div>
      </div>
    </SlidePane>
  );
}