import React, { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UPLOAD_ACCEPT, validateUploadFile } from '@/lib/uploadValidation';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import CopilotIcon from './CopilotIcon';
import CopilotComposerFiles from './CopilotComposerFiles';
import CopilotSendingVeil from './CopilotSendingVeil';

const MAX_FILES = 5;
const ROUND_BUTTON =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Message card: the copilot's avatar beside a multi-line field, then round attach and send buttons under a divider.
 * Enter and Shift+Enter both add a line; only the send button sends. `onSend(text, files)` resolves to whether the message went through;
 * one that did not stays in the card for another try.
 */
export default function CopilotComposer({ copilot, placeholder, sending, onSend }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const ready = !sending && (text.trim().length > 0 || files.length > 0);

  const submit = async () => {
    if (!ready) return;
    setError('');
    if (await onSend(text.trim(), files.map((f) => f.file))) {
      setText('');
      setFiles([]);
    }
  };

  const addFiles = (e) => {
    const picked = Array.from(e.target.files);
    // Lets the same file be picked again after it is removed.
    e.target.value = '';
    const invalid = picked.map(validateUploadFile).find(Boolean);
    const valid = picked.filter((file) => !validateUploadFile(file)).map((file) => ({ id: crypto.randomUUID(), file }));
    const room = MAX_FILES - files.length;
    setError(valid.length > room ? `You can attach up to ${MAX_FILES} files.` : invalid || '');
    setFiles([...files, ...valid.slice(0, room)]);
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="relative overflow-hidden rounded-[20px] border border-border bg-card px-4 pb-3 pt-4 text-left shadow-[0_4px_16px_rgba(14,16,20,0.06)] transition-colors focus-within:border-primary/50 dark:bg-background dark:shadow-none"
    >
      <div className="flex items-start gap-3">
        <CopilotIcon copilot={copilot} size={36} />
        <AutoGrowTextarea
          autoFocus
          rows={2}
          value={text}
          readOnly={sending}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="mt-2 max-h-40 min-w-0 flex-1 overflow-y-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      <CopilotComposerFiles files={files} onRemove={(id) => setFiles(files.filter((f) => f.id !== id))} />
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <p role="alert" className="min-w-0 flex-1 text-xs text-destructive">{error}</p>
        <input ref={fileInput} type="file" multiple hidden accept={UPLOAD_ACCEPT} onChange={addFiles} />
        <button
          type="button"
          disabled={sending}
          onClick={() => fileInput.current.click()}
          aria-label="Attach files"
          title="Attach files"
          className={cn(ROUND_BUTTON, 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground')}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="submit"
          disabled={!ready}
          aria-label="Send"
          title="Send"
          className={cn(
            ROUND_BUTTON,
            ready
              ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border-border bg-card text-muted-foreground/60',
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <CopilotSendingVeil copilot={copilot} show={sending} />
    </form>
  );
}