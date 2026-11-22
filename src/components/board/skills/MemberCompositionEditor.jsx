import React from 'react';
import SectionCard from '@/components/shared/SectionCard';
import AttributeCategorySection from './AttributeCategorySection';

/** Editable composition attribute selections for one member, wrapped in one Composition section. */
export default function MemberCompositionEditor({ attributeCategories, options, attrSelections, setAttrSelections }) {
  return (
    <SectionCard title="Composition">
      {attributeCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No composition categories configured.</p>
      ) : (
        <div className="space-y-5">
          {attributeCategories.map((cat) => (
            <AttributeCategorySection key={cat.id} category={cat}
              options={options.filter((o) => o.category_id === cat.id)}
              selectedIds={attrSelections[cat.id] || []}
              onChange={(ids) => setAttrSelections((prev) => ({ ...prev, [cat.id]: ids }))} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}