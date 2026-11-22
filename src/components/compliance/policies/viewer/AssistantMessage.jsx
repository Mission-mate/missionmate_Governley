import React from 'react';
import ReactMarkdown from 'react-markdown';

const SourcePill = ({ heading, sections, onJump }) => {
  const idx = sections.findIndex((s) => s.heading === heading);
  if (idx < 0) return null;
  return (
    <button type="button" onClick={() => onJump(idx)} className="inline-flex max-w-full items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors">
      <span className="truncate">§{idx + 1} {heading.replace(/^\d+[.)]?\s*/, '')}</span>
    </button>
  );
};

export default function AssistantMessage({ msg, sections, onJump }) {
  if (msg.role === 'user') {
    return <div className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm">{msg.text}</div>;
  }
  const points = msg.found ? (msg.points || []).filter((p) => p.text) : [];
  return (
    <div className="mr-4 rounded-xl bg-muted/60 px-4 py-3 space-y-2 text-sm text-foreground">
      {msg.answer && <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1"><ReactMarkdown>{msg.answer}</ReactMarkdown></div>}
      {points.length > 0 && (
        <ol className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
              <div className="min-w-0 space-y-1"><p className="leading-6">{p.text}</p>{p.section && <SourcePill heading={p.section} sections={sections} onJump={onJump} />}</div>
            </li>
          ))}
        </ol>
      )}
      {msg.found && !points.length && msg.source_section && <SourcePill heading={msg.source_section} sections={sections} onJump={onJump} />}
    </div>
  );
}