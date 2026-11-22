import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

export default function NarrativeSection({ title, content }) {
  if (!content || (Array.isArray(content) && !content.length)) return null;
  return (
    <section>
      <h3 className="text-base font-bold text-foreground border-l-[3px] border-primary pl-2.5 mb-3">{title}</h3>
      <div className={`${ELEVATED_CARD} p-5 prose prose-sm max-w-none text-muted-foreground`}>
        {Array.isArray(content) ? (
          <ul className="space-y-2 m-0">{content.map((item, index) => <li key={index}>{typeof item === 'string' ? item : <><strong>{item.title}</strong>{item.detail ? ` — ${item.detail}` : ''}</>}</li>)}</ul>
        ) : <ReactMarkdown>{content}</ReactMarkdown>}
      </div>
    </section>
  );
}