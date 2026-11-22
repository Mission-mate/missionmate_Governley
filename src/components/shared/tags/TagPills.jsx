import React from 'react';
import { useTags } from '@/hooks/useTags';
import { getTagPillClasses } from '@/lib/tagColors';

/**
 * Renders a set of stored Tag IDs as colour-coded pills.
 * The single read surface for tags — tables, view panes and detail tabs all use
 * this so tag styling can never drift between modules.
 */
export default function TagPills({ ids = [], empty = null, className = '' }) {
  const { resolveTags } = useTags();
  const tags = resolveTags(ids);

  if (tags.length === 0) return empty;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {tags.map((tag) => (
        <span key={tag.id} className={getTagPillClasses(tag.color)}>
          {tag.name}
        </span>
      ))}
    </div>
  );
}