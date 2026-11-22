import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { docTypeLabel } from '@/lib/boardDocuments';
import { resolveDocumentUrl } from '@/lib/documentStorage';
import CloseButton from '@/components/shared/CloseButton';

function Notice({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{text}</p>
      {children}
    </div>
  );
}

/**
 * Previews a stored document through a short-lived signed link (PDF and images inline).
 */
export default function ViewBoardDocumentModal({ doc, entity = 'Document', onClose }) {
  const [url, setUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | failed
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!doc?.file_url) { setStatus('idle'); return; }
    setStatus('loading');
    resolveDocumentUrl(doc, entity)
      .then((signed) => { if (!cancelled) { setUrl(signed); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('failed'); });
    return () => { cancelled = true; };
  }, [doc, entity, attempt]);

  if (!doc) return null;

  const canPreview = status === 'ready' && (doc.mime_type?.includes('pdf') || doc.mime_type?.includes('image'));

  return (
    <ModalOverlay isOpen={!!doc} onClose={onClose} className="w-full max-w-3xl">
      <div className="bg-card rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{doc.title}</h2>
            <p className="text-xs text-muted-foreground truncate">{docTypeLabel(doc.doc_type)}{doc.file_name ? ` · ${doc.file_name}` : ''}</p>
          </div>
          <CloseButton onClick={onClose} className="shrink-0 ml-4" />
        </div>

        <div className="flex-1 overflow-hidden bg-muted/20">
          {status === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading document…</p>
            </div>
          ) : status === 'failed' ? (
            <Notice icon={AlertCircle} title="Couldn’t load this document" text="Something went wrong while opening the file. Your document hasn’t been changed.">
              <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
            </Notice>
          ) : status === 'idle' ? (
            <Notice icon={FileText} title="No file attached" text="This document doesn’t have a file stored with it." />
          ) : canPreview ? (
            <iframe src={url} title={doc.title} className="w-full h-[60vh] border-0" />
          ) : (
            <Notice icon={FileText} title="Preview not available" text="This file type can't be previewed inline. Open it in a new tab instead.">
              <Button asChild>
                <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /> Open File</a>
              </Button>
            </Notice>
          )}
        </div>

        {canPreview && (
          <div className="flex items-center justify-end px-6 py-3 border-t border-border shrink-0">
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /> Open in new tab</a>
            </Button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}