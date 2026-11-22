import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PeopleTable from '@/components/board/people/PeopleTable';
import PeopleBulkBar from '@/components/board/people/PeopleBulkBar';
import AddPersonModal from '@/components/board/people/AddPersonModal';
import ViewPersonPane from '@/components/board/people/ViewPersonPane';
import RemovePersonDialog from '@/components/board/people/RemovePersonDialog';
import MeetingAttendanceTab from '@/components/board/people/attendance/MeetingAttendanceTab';
import SkillsMatrixTab from '@/components/board/skills/SkillsMatrixTab';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import {
  BOARD_PEOPLE_TABS as TABS,
  COMMITTEE_MEMBERS_REGISTER_TAB,
  ATTENDANCE_TAB,
  SKILLS_MATRIX_TAB } from
'@/lib/boardPeopleTabs';

export default function BoardPeople() {
  const initialTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
  const [tab, setTab] = useState(TABS.some((t) => t.value === initialTab) ? initialTab : COMMITTEE_MEMBERS_REGISTER_TAB);
  const [committeeSubTab, setCommitteeSubTab] = useState('board_member');
  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  // True when the pane should open straight into edit mode.
  const [viewStartEdit, setViewStartEdit] = useState(false);

  const { data: people = [], isLoading, ...read } = useQuery({
    queryKey: ['boardPeople'],
    queryFn: () => base44.entities.BoardPerson.list('-created_date')
  });

  // Selection belongs to the register list being viewed — leaving that context
  // (tab or sub-tab) drops it so the floating bar never outlives its rows.
  useEffect(() => {setSelected(null);}, [tab, committeeSubTab]);

  const filtered = people.filter((p) => p.type === committeeSubTab);
  const existingUserIds = people.map((p) => p.user_id).filter(Boolean);

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">People</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage board and committee members</p>
        </div>
        {tab === SKILLS_MATRIX_TAB ?
        <div id="skills-header-actions" className="shrink-0" /> :
        tab === ATTENDANCE_TAB ?
        null :

        <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Committee Member
          </Button>
        }
      </div>

      {/* Underline tabs */}
      <div className="flex items-center gap-6 border-b border-border mb-6">
        {TABS.map((t) =>
        <button
          key={t.value}
          onClick={() => setTab(t.value)}
          className={cn(
            'pb-3 -mb-px text-sm font-medium border-b-2 transition-colors',
            tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}>
          
            {t.label}
          </button>
        )}
      </div>

      {tab === ATTENDANCE_TAB ?
      <MeetingAttendanceTab /> :
      tab === SKILLS_MATRIX_TAB ?
      <SkillsMatrixTab /> :

      <div className="space-y-4">
          <CapsuleTabs
          animated
          tabs={[
          { value: 'board_member', label: 'Board Members', count: people.filter((p) => p.type === 'board_member').length },
          { value: 'non_board_member', label: 'Non-Board Members', count: people.filter((p) => p.type === 'non_board_member').length }]}
          value={committeeSubTab}
          onChange={setCommitteeSubTab} />

          <div className="space-y-3">
            {isLoading ?
          <ModuleLoader /> :
          read.isLoadingError ?
          <LoadError failure={read} title="Couldn’t load people" /> :
          filtered.length === 0 ?
          <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No {committeeSubTab === 'board_member' ? 'board members' : 'non-board members'} yet.</p>
              </div> :

          <PeopleTable
            people={filtered}
            onView={(p) => {setViewStartEdit(false);setViewTarget(p);setSelected(null);}}
            selectedId={selected?.id}
            onToggleSelect={(p) => setSelected((cur) => cur?.id === p.id ? null : p)} />
          }
          </div>
        </div>
      }

      <PeopleBulkBar
        open={!!selected}
        onView={() => {setViewStartEdit(false);setViewTarget(selected);setSelected(null);}}
        onEdit={() => {setViewStartEdit(true);setViewTarget(selected);setSelected(null);}}
        onRemove={() => {setRemoveTarget(selected);setSelected(null);}}
        onClear={() => setSelected(null)} />

      <AddPersonModal isOpen={addOpen} onClose={() => setAddOpen(false)} existingUserIds={existingUserIds} />
      <ViewPersonPane
        person={viewTarget ? people.find((p) => p.id === viewTarget.id) || viewTarget : null}
        isOpen={!!viewTarget}
        onClose={() => {setViewTarget(null);setViewStartEdit(false);}}
        startInEdit={viewStartEdit} />
      <RemovePersonDialog person={removeTarget} isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} />
    </div>);

}