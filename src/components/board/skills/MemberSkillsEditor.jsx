import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SKILL_LEVELS } from '@/lib/boardSkills';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SectionCard from '@/components/shared/SectionCard';

/** Editable assigned skills and the Skill Hub picker for one member, wrapped in one Skills section. */
export default function MemberSkillsEditor({ rows, setRows, allSkills }) {
  const usedIds = rows.map((r) => r.skill_id);
  const available = allSkills.filter((s) => !usedIds.includes(s.id));
  const addSkill = (skill) => setRows((prev) => [...prev, { skill_id: skill.id, skill_name: skill.name, level: 2 }]);
  const removeRow = (skillId) => setRows((prev) => prev.filter((r) => r.skill_id !== skillId));
  const setLevel = (skillId, level) => setRows((prev) => prev.map((r) => (r.skill_id === skillId ? { ...r, level } : r)));

  return (
    <SectionCard title="Skills">
      <div className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Assigned Skills</p>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg bg-background">
              No skills assigned yet. Add from the hub below.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.skill_id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background">
                  <span className="flex-1 text-sm font-medium text-foreground">{r.skill_name}</span>
                  <Select value={String(r.level)} onValueChange={(v) => setLevel(r.skill_id, Number(v))}>
                    <SelectTrigger className="h-8 w-auto px-2 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={String(l.value)}>{l.value} - {l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => removeRow(r.skill_id)} title="Remove" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Add from Skill Hub</p>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">All skills assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((s) => (
                <button key={s.id} onClick={() => addSkill(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-sm text-foreground hover:bg-primary/5 hover:border-primary/40 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-primary" /> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}