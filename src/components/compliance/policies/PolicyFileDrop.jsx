import React, { useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MAX_UPLOAD_BYTES, UPLOAD_SIZE_ERROR } from '@/lib/uploadValidation';

const ACCEPT = '.pdf,application/pdf';
const isAllowed = (f) => /\.pdf$/i.test(f.name) && (!f.type || f.type === 'application/pdf');
export const titleFromFile = (f) => (f?.name || '').replace(/\.(pdf|docx?)$/i, '');

/**
 * Single PDF file picker. The required Document Display Title appears above the
 * upload once a file is chosen (or always, with `showTitle`) and is prefilled from the
 * filename unless the user has typed their own.
 */
export default function PolicyFileDrop({ file, onChange, error, onError, title, onTitleChange, titleError, showTitle = false }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const choose = (f) => {
    if (f && (!title?.trim() || title === titleFromFile(file))) onTitleChange(titleFromFile(f));
    onChange(f);
  };
  const pick = (files) => {
    if (!files?.length) return;
    if (files.length > 1) return onError('Only one document can be uploaded.');
    if (!isAllowed(files[0])) return onError('Only PDF files (.pdf) are allowed.');
    if (files[0].size > MAX_UPLOAD_BYTES) return onError(UPLOAD_SIZE_ERROR);
    onError(''); choose(files[0]);
  };

  return (
    <div className="space-y-4">
      {(file || showTitle) && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Document Display Title <span className="text-destructive">*</span></label>
          <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Title shown in the table and preview" />
          {titleError && <p className="text-xs text-destructive">{titleError}</p>}
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Policy Document <span className="text-destructive">*</span></p>
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" title="Remove file" onClick={() => onChange(null)} className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
            className={cn('w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
              over ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:border-primary/60')}>
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Drag a file here or click to browse</span>
            <span className="text-xs text-muted-foreground">Supported format: PDF (.pdf) Only, up to 50MB</span>
          </button>
        )}
        <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}