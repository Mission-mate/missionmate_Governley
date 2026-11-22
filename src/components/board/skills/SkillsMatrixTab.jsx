import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  listSkills, listMemberSkills, ensureDefaultSkills, levelLabel, LEVEL_STYLES,
} from '@/lib/boardSkills';
import { base44 } from '@/api/base44Client';
import { listCategories, listOptions, listMemberAttributes, ensureDefaultCategories } from '@/lib/boardCategories';
import CustomizerPane from './customizer/CustomizerPane';
import MemberSkillsPane from './MemberSkillsPane';
import OverflowChipRow from './OverflowChipRow';
import SkillsBreakdownChart from './SkillsBreakdownChart';
import CompositionCharts from './CompositionCharts';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import MatrixViewSwitcher from './MatrixViewSwitcher';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'board_member', label: 'Board Members' },
  { value: 'non_board_member', label: 'Non-Board Members' },
];

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const renderSkillChip = (m) => {
  const style = LEVEL_STYLES[m.level] || LEVEL_STYLES[1];
  return (
    <span key={m.id} className={cn('inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-xs font-medium shrink-0', style.bg, style.text)} title={levelLabel(m.level)}>
      {m.skill_name}<span className="font-bold opacity-70">· {m.level}</span>
    </span>
  );
};

const renderAttributeChip = (a) => (
  <span key={a.id} className="inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium bg-primary/10 text-primary shrink-0" title={a.category_name}>{a.option_name}</span>
);

export default function SkillsMatrixTab() {
  const qc = useQueryClient();
  const [typeTab, setTypeTab] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [hubOpen, setHubOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  // Seed default skills once if hub is empty
  useEffect(() => {
    ensureDefaultSkills().then(() => qc.invalidateQueries({ queryKey: ['boardSkills'] }));
    ensureDefaultCategories().then(() => {
      qc.invalidateQueries({ queryKey: ['boardCategories'] });
      qc.invalidateQueries({ queryKey: ['boardCategoryOptions'] });
    });
  }, []);

  const { data: people = [], isLoading: peopleLoading, ...peopleRead } = useQuery({
    queryKey: ['boardPeople'],
    queryFn: () => base44.entities.BoardPerson.list('-created_date'),
  });
  const { data: skills = [], isLoading: skillsLoading, ...skillsRead } = useQuery({ queryKey: ['boardSkills'], queryFn: listSkills });
  const { data: memberSkills = [], isLoading: memberSkillsLoading, ...memberSkillsRead } = useQuery({ queryKey: ['memberSkills'], queryFn: listMemberSkills });
  const { data: categories = [], isLoading: categoriesLoading, ...categoriesRead } = useQuery({ queryKey: ['boardCategories'], queryFn: listCategories });
  const { data: options = [], ...optionsRead } = useQuery({ queryKey: ['boardCategoryOptions'], queryFn: listOptions });
  const { data: memberAttributes = [], ...attributesRead } = useQuery({ queryKey: ['memberAttributes'], queryFn: listMemberAttributes });
  const isLoading = peopleLoading || skillsLoading || memberSkillsLoading || categoriesLoading;
  const failure = loadFailure(peopleRead, skillsRead, memberSkillsRead, categoriesRead, optionsRead, attributesRead);

  const attributesByPerson = useMemo(() => {
    const map = new Map();
    memberAttributes.forEach((a) => {
      if (!map.has(a.person_id)) map.set(a.person_id, []);
      map.get(a.person_id).push(a);
    });
    return map;
  }, [memberAttributes]);

  const skillsByPerson = useMemo(() => {
    const map = new Map();
    memberSkills.forEach((m) => {
      if (!map.has(m.person_id)) map.set(m.person_id, []);
      map.get(m.person_id).push(m);
    });
    return map;
  }, [memberSkills]);

  const counts = useMemo(() => ({
    all: people.length,
    board_member: people.filter((p) => p.type === 'board_member').length,
    non_board_member: people.filter((p) => p.type === 'non_board_member').length,
  }), [people]);

  const filtered = useMemo(
    () => (typeTab === 'all' ? people : people.filter((p) => p.type === typeTab)),
    [people, typeTab]
  );

  const [headerSlot, setHeaderSlot] = useState(null);
  useEffect(() => { setHeaderSlot(document.getElementById('skills-header-actions')); }, []);

  const headerActions = (
    <Button onClick={() => setHubOpen(true)} className="shrink-0">
      <SlidersHorizontal className="w-4 h-4" /> Customise
    </Button>
  );

  return (
    <div>
      {headerSlot ? createPortal(headerActions, headerSlot) : <div className="mb-5 flex justify-end">{headerActions}</div>}

      {/* Capsule type tabs */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <CapsuleTabs
          animated
          value={typeTab}
          onChange={setTypeTab}
          tabs={TYPE_TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value] }))}
        />
        <MatrixViewSwitcher value={viewMode} onChange={setViewMode} />
      </div>

      {isLoading ? <ModuleLoader /> : failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load the skills matrix" /> : <>
      {/* Table */}
      {viewMode === 'list' && (
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide w-64">Member</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Skills and Composition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={2} className="py-16 text-center text-muted-foreground text-sm">
                <Users className="w-9 h-9 mx-auto mb-3 text-muted-foreground/40" />
                No {typeTab === 'all' ? 'committee members' : typeTab === 'board_member' ? 'board members' : 'non-board members'} yet.
              </td></tr>
            ) : (
              filtered.map((p) => {
                const mine = (skillsByPerson.get(p.id) || []).sort((a, b) => (b.level || 0) - (a.level || 0));
                return (
                  <tr
                    key={p.id}
                    onClick={() => setViewTarget(p)}
                    className="hover:bg-sidebar-accent/70 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(p.member_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.member_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.position || 'Member'}</p>
                        </div>
                      </div>
                    </td>
                    {/* max-w-0 + w-full: the column takes the remaining width without growing to fit its chips. */}
                    <td className="px-4 py-3 w-full max-w-0">
                      {mine.length === 0 ? (
                        <span className="text-sm text-muted-foreground/50">Add skills to the committee member</span>
                      ) : (
                        <OverflowChipRow items={mine} renderChip={renderSkillChip} />
                      )}
                      <div className="my-2.5 border-t border-border" />
                      {(attributesByPerson.get(p.id) || []).length === 0 ? (
                        <span className="text-sm text-muted-foreground/50">No attributes assigned</span>
                      ) : (
                        <OverflowChipRow items={attributesByPerson.get(p.id)} renderChip={renderAttributeChip} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Charts */}
      {viewMode === 'charts' && (
      <div>
        <SkillsBreakdownChart skills={skills} memberSkills={memberSkills} people={filtered} />
        <CompositionCharts categories={categories} options={options} memberAttributes={memberAttributes} people={filtered} />
      </div>
      )}
      </>}

      <CustomizerPane isOpen={hubOpen} onClose={() => setHubOpen(false)} />
      <MemberSkillsPane person={viewTarget} isOpen={!!viewTarget} onClose={() => setViewTarget(null)} />
    </div>
  );
}