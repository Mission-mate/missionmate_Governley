import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import { cn } from '@/lib/utils';
import { TagBadge } from './TagModal';

const TH = 'text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle';

/** Tags list with single-select circles (matches the Team Members table). Row click opens the view. */
export default function TagsTable({ tags, selectedId, onSelect, onView }) {
  if (tags.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No tags yet. Click <span className="font-medium text-primary">+ Add Tag</span> to create one.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="w-12 px-4 py-3" />
          <th className={TH}>Tag Name</th>
          <th className={TH}>Preview</th>
          <th className={TH}>Description</th>
        </tr>
      </thead>
      <tbody>
        {tags.map((tag) => {
          const selected = selectedId === tag.id;
          return (
            <tr
              key={tag.id}
              onClick={() => onView(tag)}
              className={cn(
                'border-b border-border last:border-0 transition-colors cursor-pointer',
                selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70'
              )}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <CircleCheck checked={selected} onChange={() => onSelect(selected ? null : tag.id)} />
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{tag.name}</td>
              <td className="px-4 py-3"><TagBadge name={tag.name} color={tag.color} /></td>
              <td className="px-4 py-3 text-muted-foreground">{tag.description || '–'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}