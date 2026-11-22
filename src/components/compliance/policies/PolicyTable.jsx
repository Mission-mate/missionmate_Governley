import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COMPLIANCE_TABLE } from '@/components/compliance/complianceSurfaces';
import PolicyRow from './PolicyRow';
import Collapse from '@/components/shared/Collapse';
import { tableVisibleColumns } from '@/lib/assetRegister';

const TH = 'py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle';

/** Category-grouped tree table; linked documents sit indented under their policy. */
export default function PolicyTable({ categories, tree, allDocs, filtering, columns = [], selectedId, onSelect }) {
  const extra = tableVisibleColumns(columns);
  const [collapsed, setCollapsed] = useState({});
  const [expanded, setExpanded] = useState(() => new Set());
  const toggle = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const linkedCount = (id) => allDocs.filter((d) => d.parent_id === id).length;

  return (
    <div className={`${COMPLIANCE_TABLE} overflow-x-auto`}>
      <table className="w-full table-fixed" style={{ minWidth: 900 + extra.length * 160 }}>
        <thead>
          <tr className="bg-secondary/40 border-b border-border text-left">
            <th className="py-3 pl-4 pr-0 w-12" />
            <th className={TH}>Document Title</th>
            <th className={`${TH} w-[15%]`}>Owner</th>
            <th className={`${TH} w-[11%]`}>Stage</th>
            <th className={`${TH} w-[12%]`}>Last Review Date</th>
            <th className={`${TH} w-[12%]`}>Next Review Date</th>
            <th className={`${TH} w-[8%]`}>Status</th>
            {extra.map((c) => <th key={c.id} className={`${TH} w-40`}>{c.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const items = tree[cat] || [];
            if (filtering && !items.length) return null;
            const count = items.reduce((n, i) => n + (i.muted ? 0 : 1) + i.children.length, 0);
            return (
              <React.Fragment key={cat}>
                <tr className="border-b border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }))}>
                  <td colSpan={7 + extra.length} className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${collapsed[cat] ? '-rotate-90' : ''}`} />
                      <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))]">{cat}</span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
                    </div>
                  </td>
                </tr>
                <Collapse open={!collapsed[cat]}>{(catCls, catClosing) => items.map(({ doc, muted, children }) => {
                  const open = filtering || expanded.has(doc.id);
                  return (
                    <React.Fragment key={doc.id}>
                      <PolicyRow className={catCls} doc={doc} muted={muted} linkedCount={linkedCount(doc.id)} expanded={open} onToggle={() => toggle(doc.id)} columns={extra}
                        selected={selectedId === doc.id} onSelect={() => onSelect(selectedId === doc.id ? null : doc.id)} />
                      <Collapse open={open}>{(cls) => children.map((c, i) => (
                        <PolicyRow key={c.id} className={catClosing ? catCls : cls} doc={c} child last={i === children.length - 1} columns={extra} selected={selectedId === c.id} onSelect={() => onSelect(selectedId === c.id ? null : c.id)} />
                      ))}</Collapse>
                    </React.Fragment>
                  );
                })}</Collapse>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}