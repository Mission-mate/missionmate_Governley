import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, SendHorizontal, Loader2, FileText, X } from 'lucide-react';
import ComposerAddMenu from './ComposerAddMenu';
import { toast } from '@/components/ui/use-toast';
import { validateUploadFile, UPLOAD_ACCEPT } from '@/lib/uploadValidation';
import { fileSize } from '@/lib/conversations';
import EmojiPicker from './EmojiPicker';
import { cn } from '@/lib/utils';

const MAX_INPUT_HEIGHT = 140;
const TOOL_BUTTON = 'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200';

/**
 * Message composer: text, emoji, one optional file, and a "+" menu.
 * `onSend({ text, file })` resolves once the message is sent; `onAddPoll()` starts a new poll.
 */
export default function MessageComposer({ onSend, onAddPoll, placeholder = 'Write a message' }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  // Set on the first send, so the icon's return animation never plays when the composer first appears.
  const [hasSent, setHasSent] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const canSend = !sending && (text.trim().length > 0 || !!file);

  useEffect(() => {
    const el = inputRef.current;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [text]);

  const pickFile = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const invalid = validateUploadFile(picked);
    if (invalid) {
      toast({ variant: 'destructive', title: 'Can’t attach this file', description: invalid });
      return;
    }
    setFile(picked);
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => el.setSelectionRange(start + emoji.length, start + emoji.length));
  };

  const submit = async () => {
    if (!canSend) return;
    setHasSent(true);
    setSending(true);
    try {
      await onSend({ text: text.trim(), file });
      setText('');
      setFile(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Message not sent',
        description: 'Something went wrong. Your message is still here, so you can try again.',
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-4 md:px-6 pt-2 pb-4 shrink-0">
      <div>
        {file && (
          <div className="mb-2 inline-flex items-center gap-2.5 max-w-full rounded-xl bg-muted pl-2.5 pr-1.5 py-1.5 animate-expand-enter">
            <FileText className="w-4 h-4 text-primary shrink-0" strokeWidth={1.8} />
            <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{fileSize(file.size)}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={sending}
              title="Remove file"
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-card transition-colors duration-200"
            >
              <X className="w-3.5 h-3.5" />
              <span className="sr-only">Remove file</span>
            </button>
          </div>
        )}
        <div className="flex items-end gap-1 rounded-2xl bg-card px-2 py-2 border border-border shadow-sm focus-within:border-ring/50 transition-colors duration-200">
          <ComposerAddMenu onAddPoll={onAddPoll} disabled={sending} triggerClassName={cn(TOOL_BUTTON, 'data-[state=open]:bg-muted data-[state=open]:text-foreground')} />
          <button type="button" title="Attach a file" onClick={() => fileRef.current.click()} disabled={sending} className={TOOL_BUTTON}>
            <Paperclip className="w-[18px] h-[18px]" strokeWidth={1.8} />
            <span className="sr-only">Attach a file</span>
          </button>
          <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} className="hidden" onChange={pickFile} />
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            maxLength={4000}
            className="flex-1 min-w-0 resize-none bg-transparent border-0 outline-none text-sm leading-6 text-foreground placeholder:text-muted-foreground px-2 py-1.5"
          />
          <EmojiPicker onPick={insertEmoji} triggerClassName={TOOL_BUTTON} />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            title="Send"
            className={cn(
              'group relative overflow-hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-primary-foreground transition-[background-color,transform,opacity] duration-200',
              canSend || sending ? 'bg-primary hover:bg-primary/90 active:scale-95' : 'bg-primary/35'
            )}
          >
            <span
              className={cn(
                'flex transition-transform duration-300 ease-out motion-reduce:transition-none',
                canSend && 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:-rotate-12 motion-reduce:transform-none'
              )}
            >
              <SendHorizontal
                className={cn(
                  'w-4 h-4 motion-reduce:animate-none',
                  sending ? 'opacity-0 animate-send-out' : hasSent && 'animate-send-in'
                )}
                strokeWidth={1.8}
              />
            </span>
            {sending && (
              <span className="absolute inset-0 flex items-center justify-center animate-send-wait motion-reduce:animate-none">
                <Loader2 className="w-4 h-4 animate-spin" />
              </span>
            )}
            <span className="sr-only">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}