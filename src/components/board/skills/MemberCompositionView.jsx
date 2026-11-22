import React from 'react';
import SectionCard from '@/components/shared/SectionCard';

/** Read-only composition attributes (gender, location, …) for one member. */
export default function MemberCompositionView({ attributeCategories, attributes }) {
  return (
    <SectionCard title="Composition">
      {attributeCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No composition categories configured.</p>
      ) : (
        <div className="space-y-4">
          {attributeCategories.map((cat) => {
            const vals = attributes.filter((a) => a.category_id === cat.id);
            return (
              <div key={cat.id}>
                <p className="text-xs text-muted-foreground mb-1.5">{cat.name}</p>
                {vals.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60">Not specified</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {vals.map((a) => <span key={a.id} className="inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium bg-primary/10 text-primary">{a.option_name}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}