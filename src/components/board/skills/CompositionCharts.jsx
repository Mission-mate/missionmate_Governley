import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CompositionDonut from './CompositionDonut';

/**
 * One member-count chart per attribute category (non-Skills).
 * Only assignments belonging to people in the current filtered list are counted.
 */
export default function CompositionCharts({ categories = [], options = [], memberAttributes = [], people = [] }) {
  const attrs = useMemo(() => {
    const active = new Set(people.map((p) => p.id));
    return memberAttributes.filter((a) => active.has(a.person_id));
  }, [memberAttributes, people]);

  const cards = useMemo(() => categories.filter((c) => c.kind !== 'skills').map((cat) => {
    const opts = options.filter((o) => o.category_id === cat.id);
    const counts = new Map(opts.map((o) => [o.id, 0]));
    attrs.forEach((a) => { if (a.category_id === cat.id && counts.has(a.option_id)) counts.set(a.option_id, counts.get(a.option_id) + 1); });
    const members = new Set(attrs.filter((a) => a.category_id === cat.id).map((a) => a.person_id)).size;
    return { cat, members, entries: opts.map((o) => ({ id: o.id, name: o.name, value: counts.get(o.id) || 0 })).sort((a, b) => b.value - a.value) };
  }), [categories, options, attrs]);

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
      {cards.map(({ cat, members, entries }, i) => (
        <motion.div key={cat.id} className="bg-card border border-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}>
          <div className="mb-3">
            <h3 className="text-lg font-bold text-foreground">{cat.name}</h3>
            <p className="text-xs text-muted-foreground font-semibold">By member count · {members} {members === 1 ? 'Member' : 'Members'}</p>
          </div>
          <CompositionDonut entries={entries} />
        </motion.div>
      ))}
    </div>
  );
}