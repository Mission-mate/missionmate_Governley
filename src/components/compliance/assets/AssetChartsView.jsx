import React, { useMemo } from 'react';
import GrantDonutChart from '@/components/grants/dashboard/GrantDonutChart';
import { assetFieldValue } from '@/lib/assetRegisterView';

const CHARTS = [
  { id: 'asset_type', title: 'Assets by Type', subtitle: 'Active assets only, by asset type' },
  { id: 'location', title: 'Assets by Location', subtitle: 'Active assets only, by location' },
  { id: 'condition', title: 'Assets by Condition', subtitle: 'Active assets only, by condition' },
];

/** Counts assets per option, ordered by the field's option list with blanks ('—') last. */
function distribution(assets, fieldId, values) {
  const counts = new Map();
  assets.forEach((a) => {
    const key = assetFieldValue(a, fieldId) || '—';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const order = [...values, '—'];
  const rank = (k) => (order.indexOf(k) === -1 ? order.length - 1.5 : order.indexOf(k));
  return [...counts.keys()].sort((a, b) => rank(a) - rank(b)).map((name) => ({ name, value: counts.get(name) }));
}

export default function AssetChartsView({ items, fields }) {
  const active = useMemo(() => items.filter((a) => a.status === 'Active'), [items]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {CHARTS.map((c) => (
        <GrantDonutChart
          key={c.id}
          title={c.title}
          subtitle={c.subtitle}
          data={distribution(active, c.id, fields.find((f) => f.id === c.id)?.values || [])}
          centerLabel={String(active.length)}
        />
      ))}
    </div>
  );
}