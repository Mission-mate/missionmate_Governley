import React, { useState } from 'react';
import FolderPager from '@/components/documents/FolderPager';
import SelectionActionBar from '@/components/documents/SelectionActionBar';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import LoadError from '@/components/shared/states/LoadError';
import { toast } from '@/components/ui/use-toast';
import { openAttachment, downloadAttachment, deleteFile, apiErrorMessage } from '@/lib/conversationsApi';
import SharedFileRow from './SharedFileRow';

/** Total files once they have loaded; undefined while loading or failed. */
export const sharedFilesCount = ({ total, isLoading, failure }) => (isLoading || failure ? undefined : total);

/**
 * Files shared in the conversation, newest first, ten to a page. Selecting one shows Open, Download and Delete
 * at the bottom of the pane; Delete removes the file for every member and reports it through
 * `onFileDeleted(messageId, conversation)`. Delete shows only when `canDelete(file)` (its sender or a group admin).
 * `shared` comes from useSharedFiles.
 */
export default function SharedFilesSection({ shared, canDelete, onFileDeleted }) {
  const { files, page, totalPages, changePage, isLoading, failure } = shared;
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  // A file that left the page (deleted, or the page changed) drops its selection.
  const selected = files.find((f) => f.id === selectedId) || null;

  const confirmDelete = async () => {
    try {
      const conversation = await deleteFile(deleting.id);
      setDeleting(null);
      setSelectedId(null);
      onFileDeleted(deleting.id, conversation);
      await shared.sync();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t delete the file', description: apiErrorMessage(err) });
    }
  };

  return (
    <section className="flex-1 flex flex-col px-5 py-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading files...</p>
      ) : failure ? (
        <LoadError failure={failure} title="Couldn’t load shared files" />
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files shared yet.</p>
      ) : (
        <div className="content-enter">
          <div className="flex items-center gap-3 pb-2.5 border-b border-border">
            <span className="w-5 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</span>
            <div className="ml-auto">
              <FolderPager page={page} totalPages={totalPages} onPageChange={(next) => { setSelectedId(null); changePage(next); }} />
            </div>
          </div>
          {files.map((file) => (
            <SharedFileRow
              key={file.id}
              file={file}
              selected={file.id === selectedId}
              onSelect={() => setSelectedId((id) => (id === file.id ? null : file.id))}
              onOpen={() => openAttachment(file)}
            />
          ))}
        </div>
      )}

      <SelectionActionBar
        open={!!selected}
        onOpen={() => openAttachment(selected)}
        onDownload={() => downloadAttachment(selected)}
        onDelete={selected && canDelete(selected) ? () => setDeleting(selected) : undefined}
        onClear={() => setSelectedId(null)}
      />

      <ConfirmDeleteDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete file for everyone?"
        message={`“${deleting?.attachment_name}” will be permanently deleted for everyone in this conversation. Any message text sent with it stays. This can’t be undone.`}
        requireKeyword="DELETE"
        confirmLabel="Delete for everyone"
        onConfirm={confirmDelete}
      />
    </section>
  );
}