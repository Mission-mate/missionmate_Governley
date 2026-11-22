import React from 'react';

// Vertical donut legend where each colour dot is a badge containing the segment count.
export default function DonutCountLegend({ data = [] }) {
  return (
    <ul className="flex flex-col gap-1.5 pl-2">
      {data.map((d) => (
        <li key={d.name} className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white shrink-0"
            style={{ backgroundColor: d.color, width: 22, height: 22 }}
          >
            {d.value}
          </span>
          <span className="text-xs" style={{ color: d.color }}>{d.name}</span>
        </li>
      ))}
    </ul>
  );
}