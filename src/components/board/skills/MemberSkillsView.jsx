import React from 'react';
import { GraduationCap } from 'lucide-react';
import { levelLabel, LEVEL_STYLES } from '@/lib/boardSkills';
import SectionCard from '@/components/shared/SectionCard';
import { cn } from '@/lib/utils';

/** Read-only skills (highest level first) for one member. */
export default function MemberSkillsView({ rows }) {
  const sorted = [...rows].sort((a, b) => (b.level || 0) - (a.level || 0));
  return (
    <SectionCard title="Skills">
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-background">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No skills assigned to this member.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((r) => {
            const style = LEVEL_STYLES[r.level] || LEVEL_STYLES[1];
            return (
              <div key={r.skill_id} className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-background">
                <span className="text-sm font-medium text-foreground">{r.skill_name}</span>
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-xs font-medium', style.bg, style.text)}>
                  <span className="font-bold">{r.level}</span> {levelLabel(r.level)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}