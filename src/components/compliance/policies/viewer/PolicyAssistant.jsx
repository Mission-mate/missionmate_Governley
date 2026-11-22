import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import CloseButton from '@/components/shared/CloseButton';
import { askPolicy } from '@/lib/policyContent';
import AssistantMessage from './AssistantMessage';

const SUGGESTIONS = ['Summarise this in 5 points', 'What do I need to do?', 'Who do I contact, and when?', 'Explain it simply for a new volunteer'];

export default function PolicyAssistant({ doc, sections, ready, loading, onJump, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

  const ask = async (q) => {
    if (!q.trim() || busy || !ready) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: q }]);
    let reply;
    try { reply = await askPolicy(doc, sections, q); }
    catch { reply = { answer: "Sorry, I couldn't answer that right now. Please try again.", found: false }; }
    setMessages((m) => [...m, { role: 'ai', ...reply }]);
    setBusy(false);
  };

  return (
    <aside className="flex flex-col min-h-0 h-full bg-card border-t lg:border-t-0 lg:border-l border-border">
      <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">Policy Assistant</p>
          <p className="text-xs text-muted-foreground truncate">Answers from this document only</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={() => setMessages([])} disabled={busy} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><RotateCcw className="w-3 h-3" />New chat</button>
        )}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <span className={cn('w-2 h-2 rounded-full', ready ? 'bg-emerald-500' : loading ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground')} />
          {ready ? 'AI ready' : loading ? 'Preparing' : 'Unavailable'}
        </span>
        <CloseButton onClick={onClose} title="Close assistant" />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {!messages.length && (
          <div className={cn('space-y-3', !ready && 'opacity-60')}>
            <h3 className="text-base font-semibold text-foreground">Ask about this document</h3>
            <p className="text-sm text-muted-foreground">{ready ? 'Every answer links to the section it came from. Click a source to see it in the document.' : 'The assistant is available once readable document content exists.'}</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" disabled={!ready} onClick={() => ask(s)} className="w-full flex items-center gap-3 text-left text-sm px-4 py-2.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border transition-colors">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />{s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <AssistantMessage key={i} msg={m} sections={sections} onJump={onJump} />)}
        {busy && <p className="text-xs text-muted-foreground animate-pulse">Reading the document...</p>}
        <div ref={end} />
      </div>
      <div className="p-3 border-t border-border shrink-0 space-y-2">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50 transition-colors">{s}</button>)}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-2 rounded-xl border border-border bg-card pl-3.5 pr-1.5 py-1.5 focus-within:ring-1 focus-within:ring-ring">
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!ready} placeholder={ready ? 'Ask about this document...' : 'Document not available'} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" />
          <button type="submit" title="Send" disabled={!ready || busy || !input.trim()} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"><ArrowRight className="w-4 h-4" /></button>
        </form>
        <p className="text-[11px] text-muted-foreground text-center">Answers come only from this document. Check the source before acting. Not legal advice.</p>
      </div>
    </aside>
  );
}