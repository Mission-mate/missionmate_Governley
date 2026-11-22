import React, { useState, useRef } from 'react';
import { CloudUpload, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UPLOAD_ACCEPT, UPLOAD_HINT, validateUploadFile } from '@/lib/uploadValidation';

/** Drag-and-drop / click file picker. `error` shows a save failure under the zone. */
export default function UploadZone({ file, onFile, error }) {
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const err = validateUploadFile(f);
    setFileError(err);
    onFile(err ? null : f);
  };

  const message = fileError || error;

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        className={cn('border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 px-4 cursor-pointer transition-colors text-center',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30')}
      >
        <input ref={inputRef} type="file" accept={UPLOAD_ACCEPT} className="hidden" onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
        {file ? (
          <div className="flex flex-col items-center gap-2 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <p className="text-sm font-medium text-foreground truncate max-w-full">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><CloudUpload className="w-6 h-6 text-muted-foreground" /></div>
            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">{UPLOAD_HINT}</p>
          </div>
        )}
      </div>
      {message && (
        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">{message}</p>
        </div>
      )}
    </div>
  );
}