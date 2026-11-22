import React from 'react';
import startCase from 'lodash/startCase';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';

// Plain-text display of any stored value (rich text is shown without markup).
const text = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || '—';
};

// One comparison row per differing field; list items expand to their changed fields.
const toRows = (conflicts) => conflicts.flatMap((c) => {
  if (!c.itemId) return [{ label: startCase(c.field), current: text(c.current), yours: text(c.yours) }];
  const name = c.yours.title || c.yours.control || 'Item';
  if (!c.current) return [{ label: name, current: 'Deleted', yours: 'Edited' }];
  return [...new Set([...Object.keys(c.current), ...Object.keys(c.yours)])]
    .filter((k) => k !== 'id' && text(c.current[k]) !== text(c.yours[k]))
    .map((k) => ({ label: `${name} · ${startCase(k)}`, current: text(c.current[k]), yours: text(c.yours[k]) }));
});

/** Shown when a Risk save is rejected because the same data changed elsewhere. */
export default function RiskConflictDialog({ conflicts, onReload, onKeep }) {
  const rows = toRows(conflicts || []);

  return (
    <ModalOverlay isOpen={!!conflicts} onClose={() => {}} overlayClassName="z-[70]" className="w-full max-w-lg">
      <div role="alertdialog" aria-labelledby="risk-conflict-title" aria-describedby="risk-conflict-desc" className="bg-card rounded-2xl shadow-2xl w-full p-6 space-y-4">
        <div>
          <h2 id="risk-conflict-title" className="text-lg font-bold text-foreground">This was changed while you were editing</h2>
          <p id="risk-conflict-desc" className="text-sm text-muted-foreground mt-1">
            Your changes have not been saved. Compare the current values with yours, then choose how to continue.
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-foreground mb-2">{row.label}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Current</p>
                  <p className="text-foreground break-words">{row.current}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Yours</p>
                  <p className="text-foreground break-words">{row.yours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onReload}>Reload current data</Button>
          <Button onClick={onKeep}>Save my changes</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}