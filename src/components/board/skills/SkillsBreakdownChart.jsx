import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SkillBarList from './SkillBarList';

/**
 * Committee Skills Matrix: member-count breakdown + skill-level score breakdown.
 * skills: BoardSkill[]   memberSkills: MemberSkill[]
 */
export default function SkillsBreakdownChart({ skills = [], memberSkills: allMemberSkills = [], people = [] }) {
  // Only count skills belonging to people that still exist in the register —
  // orphaned skill records from removed members must not inflate the chart.
  const memberSkills = useMemo(() => {
    const activeIds = new Set(people.map((p) => p.id));
    return allMemberSkills.filter((m) => activeIds.has(m.person_id));
  }, [allMemberSkills, people]);

  const { byMembers, byLevel } = useMemo(() => {
    const countMap = new Map();
    const levelMap = new Map();
    skills.forEach((s) => {
      countMap.set(s.id, 0);
      levelMap.set(s.id, 0);
    });
    memberSkills.forEach((m) => {
      if (!countMap.has(m.skill_id)) return;
      countMap.set(m.skill_id, countMap.get(m.skill_id) + 1);
      levelMap.set(m.skill_id, levelMap.get(m.skill_id) + (Number(m.level) || 0));
    });
    const rows = skills.map((s) => ({
      id: s.id,
      name: s.name,
      count: countMap.get(s.id) || 0,
      score: levelMap.get(s.id) || 0,
    }));
    return {
      byMembers: [...rows].sort((a, b) => b.count - a.count).map((r) => ({ ...r, value: r.count })),
      byLevel: [...rows].sort((a, b) => b.score - a.score).map((r) => ({ ...r, value: r.score })),
    };
  }, [skills, memberSkills]);

  const memberCount = useMemo(
    () => new Set(memberSkills.map((m) => m.person_id)).size,
    [memberSkills]
  );

  const countLabel = `${memberCount} Committee ${memberCount === 1 ? 'Member' : 'Members'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <motion.div
        className="bg-card border border-border rounded-2xl p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Committee Skills Matrix</h3>
            <p className="text-sm text-muted-foreground mb-4 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-semibold">By member count</p>
          </div>
          <span className="text-sm text-muted-foreground shrink-0 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-semibold">{countLabel}</span>
        </div>
        <SkillBarList entries={byMembers} />
      </motion.div>

      <motion.div
        className="bg-card border border-border rounded-2xl p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Committee Skills Matrix</h3>
            <p className="text-sm text-muted-foreground mb-4 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-semibold">By skill level score (Basic, Working, Strong)</p>
          </div>
          <span className="text-sm text-muted-foreground shrink-0 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-semibold">{countLabel}</span>
        </div>
        <SkillBarList entries={byLevel} barClass="bg-[hsl(var(--chart-2))]" />
      </motion.div>
    </div>
  );
}