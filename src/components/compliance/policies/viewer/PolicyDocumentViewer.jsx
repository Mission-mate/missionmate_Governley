import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, FileText, Sparkles } from 'lucide-react';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import { cn } from '@/lib/utils';
import { policyFileUrl } from '@/lib/policyContent';
import HighlightText from './HighlightText';
import ViewerSearchBar from './ViewerSearchBar';
import PolicyContentsRail from './PolicyContentsRail';
import PolicyEmptyGuidance from './PolicyEmptyGuidance';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function PolicyDocumentViewer({ doc, sections, loading, error, flash, aiOpen, onAskAi }) {
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(0);
  const [active, setActive] = useState(0);
  const body = useRef(null);
  const regex = useMemo(() => (query.trim() ? new RegExp(`(${escape(query.trim())})`, 'gi') : null), [query]);
  const counts = useMemo(() => sections.map((s) => (regex ? (s.heading + '\n' + s.text).match(regex)?.length || 0 : 0)), [sections, regex]);
  const total = counts.reduce((a, b) => a + b, 0);
  const hasContent = !loading && !error && sections.length > 0;

  useEffect(() => setCurrent(0), [query]);
  useEffect(() => { body.current?.querySelector(`[data-m="${current}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [current, total]);
  useEffect(() => { if (flash) setActive(flash.index); }, [flash]);

  const onScroll = () => {
    const el = body.current; if (!el) return;
    const top = el.getBoundingClientRect().top + 40;
    let idx = 0;
    el.querySelectorAll('section[data-idx]').forEach((s, i) => { if (s.getBoundingClientRect().top <= top) idx = i; });
    setActive(idx);
  };
  const select = (i) => document.getElementById(`policy-sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const step = (d) => total && setCurrent((c) => (c + d + total) % total);
  const openOriginal = async () => window.open(await policyFileUrl(doc), '_blank', 'noopener');
  let offset = 0;

  return (
    <div className="flex flex-col min-h-0 h-full min-w-0 bg-card">
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-medium text-foreground truncate">{doc.primary_display_title || doc.primary_file_name || 'No document uploaded'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ViewerSearchBar query={query} setQuery={setQuery} total={total} current={current} onStep={step} disabled={!hasContent} />
          {doc.primary_file_uri && (
            <button type="button" onClick={openOriginal} className="flex items-center gap-[7px] rounded-[7px] border border-border bg-card px-2.5 py-[7px] text-xs font-medium text-primary transition-[background-color,border-color,box-shadow] duration-[160ms] ease-in-out hover:bg-muted/50 hover:shadow-[0_2px_7px_rgba(15,23,42,.07)] active:bg-muted focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-ring/40 focus-visible:outline-offset-2">
              <ExternalLink className="w-3.5 h-3.5" />Open original
            </button>
          )}
          {!aiOpen && (
            <button type="button" onClick={onAskAi} className="flex items-center gap-[7px] rounded-[7px] bg-primary px-2.5 py-[7px] text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-ring/40 focus-visible:outline-offset-2">
              <Sparkles className="w-3.5 h-3.5" />Ask AI
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {hasContent && <PolicyContentsRail sections={sections} active={active} onSelect={select} />}
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderOne size="lg" />Preparing document...</div>
        ) : !hasContent ? (
          <PolicyEmptyGuidance message={error || 'No readable document content is available for this policy.'} />
        ) : (
          <div ref={body} onScroll={onScroll} className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
            <article className="max-w-3xl space-y-7">
              {sections.map((s, i) => {
                const start = offset; offset += counts[i];
                const headCount = regex ? s.heading.match(regex)?.length || 0 : 0;
                return (
                  <section key={i} data-idx={i} id={`policy-sec-${i}`}
                    className={cn('scroll-mt-4 -mx-3 px-3 py-1 rounded-lg transition-colors duration-700', flash?.index === i ? 'bg-primary/10' : 'bg-transparent')}>
                    <h2 className="text-base font-semibold text-foreground mb-2"><HighlightText text={s.heading} regex={regex} offset={start} current={current} /></h2>
                    <p className="text-sm leading-7 text-foreground/85 whitespace-pre-wrap"><HighlightText text={s.text} regex={regex} offset={start + headCount} current={current} /></p>
                  </section>
                );
              })}
            </article>
          </div>
        )}
      </div>
    </div>
  );
}