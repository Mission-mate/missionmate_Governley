import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { parseISO, format } from 'date-fns';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import AttendanceSummaryCards from './AttendanceSummaryCards';
import AttendanceTable from './AttendanceTable';
import AttendanceDateRange from './AttendanceDateRange';
import CommitteeSelector from './CommitteeSelector';
import AttendanceExportMenu from './AttendanceExportMenu';
import ThresholdModal from './ThresholdModal';
import AttendanceViewPane from './AttendanceViewPane';
import AttendanceBulkBar from './AttendanceBulkBar';
import AttendanceDeleteBlockedModal from './AttendanceDeleteBlockedModal';
import DeleteAttendanceRecordDialog from './DeleteAttendanceRecordDialog';
import { computeAttendanceStats } from '@/lib/meetingParticipants';
import { getPresetRange, PERIOD_PRESETS } from '@/lib/attendancePeriods';
import { useAttendanceThresholds } from '@/hooks/useAttendanceThresholds';
import { useOrgProfile } from '@/hooks/useOrgProfile';

const SUB_TABS = [
  { value: 'board_member', label: 'Board Members' },
  { value: 'non_board_member', label: 'Non-Board Members' },
];

export default function MeetingAttendanceTab() {
  const [subTab, setSubTab] = useState('board_member');
  const [committeeId, setCommitteeId] = useState('all');
  const [preset, setPreset] = useState('current_fy');
  const initialRange = getPresetRange('current_fy');
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [thresholdModal, setThresholdModal] = useState(null); // 'good' | 'atRisk' | null
  const [viewRow, setViewRow] = useState(null);
  const [blockedRow, setBlockedRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const { thresholds, saveThresholds, isSaving } = useAttendanceThresholds();
  const { name: orgName } = useOrgProfile();

  const periodLabel = useMemo(() => {
    if (preset === 'custom') {
      const fmt = (d) => { try { return format(parseISO(d), 'd MMM yyyy'); } catch { return d; } };
      if (fromDate && toDate) return `${fmt(fromDate)} – ${fmt(toDate)}`;
      return 'Custom range';
    }
    return PERIOD_PRESETS.find(p => p.key === preset)?.label || '';
  }, [preset, fromDate, toDate]);

  const handlePresetChange = (key) => {
    setPreset(key);
    if (key !== 'custom') {
      const { from, to } = getPresetRange(key);
      setFromDate(from);
      setToDate(to);
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  const { data: committees = [] } = useQuery({
    queryKey: ['committees'],
    queryFn: () => base44.entities.Committee.list(),
  });
  const activeCommittees = useMemo(
    () => committees.filter((c) => c.status !== 'archived'),
    [committees]
  );
  const committeeLabel = useMemo(
    () => (committeeId === 'all' ? 'All Committees' : committees.find((c) => c.id === committeeId)?.name || ''),
    [committeeId, committees]
  );

  const { data: people = [], isLoading: loadingPeople, ...peopleRead } = useQuery({
    queryKey: ['boardPeople'],
    queryFn: () => base44.entities.BoardPerson.list('-created_date'),
  });
  const { data: meetings = [], isLoading: loadingMeetings, ...meetingsRead } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list(),
  });
  const { data: participants = [], isLoading: loadingParticipants, ...participantsRead } = useQuery({
    queryKey: ['allMeetingParticipants'],
    queryFn: () => base44.entities.MeetingParticipant.list(),
  });
  const isLoading = loadingPeople || loadingMeetings || loadingParticipants;
  const failure = loadFailure(peopleRead, meetingsRead, participantsRead);

  // Filter participant records to meetings within the selected date range.
  const filtered = useMemo(() => {
    const meetingMap = new Map(meetings.map(m => [m.id, m]));
    const start = fromDate ? parseISO(fromDate) : null;
    const end = toDate ? parseISO(toDate) : null;
    return participants.filter(p => {
      const m = meetingMap.get(p.meeting_id);
      if (!m) return false;
      if (committeeId !== 'all' && m.committee_id !== committeeId) return false;
      if (!m.meeting_date) return !start && !end;
      const d = parseISO(m.meeting_date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [participants, meetings, fromDate, toDate, committeeId]);

  const stats = useMemo(() => computeAttendanceStats(filtered), [filtered]);

  const subTabsWithCounts = useMemo(
    () => SUB_TABS.map((t) => ({ ...t, count: people.filter((p) => p.type === t.value).length })),
    [people]
  );

  // Build rows per board person for the active sub-tab.
  const rows = useMemo(() => {
    return people
      .filter(p => p.type === subTab)
      .map(p => {
        const s = stats[p.id] || { present: 0, apology: 0, absent: 0, invited: 0, total: 0, rate: 0 };
        return { id: p.id, member_name: p.member_name, member_email: p.member_email, position: p.position, ...s };
      })
      // Only people with at least one attendance record in the selected
      // committee/date range — never-invited people have nothing to report on.
      .filter(r => r.total > 0);
  }, [people, subTab, stats]);

  // Summary metrics computed from rows that actually have attendance data.
  const withData = rows.filter(r => r.total > 0);
  const overall = withData.length
    ? Math.round(withData.reduce((acc, r) => acc + r.rate, 0) / withData.length)
    : 0;
  const good = withData.filter(r => r.rate > thresholds.good).length;
  const atRisk = withData.filter(r => r.rate < thresholds.atRisk).length;

  // Attendance records are audit data: deletion is only offered once the person
  // is no longer in the Committee Members Register. The register IS the
  // BoardPerson list (CommitteeMember only records committee assignments, so it
  // misses register members not assigned to any committee), so presence of the
  // BoardPerson record is the correct check.
  const handleDeleteRequest = async (row) => {
    const person = await base44.entities.BoardPerson.get(row.id).catch(() => null);
    if (person) setBlockedRow(row);
    else setDeleteRow(row);
  };

  const exportMeta = {
    orgName,
    periodLabel,
    committeeLabel,
    goodThreshold: thresholds.good,
    atRiskThreshold: thresholds.atRisk,
    summary: { overall, good, atRisk },
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <CapsuleTabs animated tabs={subTabsWithCounts} value={subTab} onChange={setSubTab} />
      </div>

      {isLoading ? <ModuleLoader /> : failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load attendance" /> : <>
      <AttendanceSummaryCards
        overall={overall}
        good={good}
        atRisk={atRisk}
        goodThreshold={thresholds.good}
        atRiskThreshold={thresholds.atRisk}
        onEditGood={() => setThresholdModal('good')}
        onEditAtRisk={() => setThresholdModal('atRisk')}
      />
      <div className="flex flex-wrap items-center gap-3 mb-6 w-full">
        <CommitteeSelector value={committeeId} onChange={setCommitteeId} committees={activeCommittees} />
        <AttendanceDateRange
          preset={preset}
          from={fromDate}
          to={toDate}
          onPresetChange={handlePresetChange}
          onFromChange={setFromDate}
          onToChange={setToDate}
        />
        <div className="ml-auto">
          <AttendanceExportMenu rows={rows} meta={exportMeta} />
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Member Attendance Records</h2>
        <p className="text-sm text-muted-foreground">Meeting attendance statistics across all meetings</p>
      </div>
      <AttendanceTable
        rows={rows}
        goodThreshold={thresholds.good}
        atRiskThreshold={thresholds.atRisk}
        onView={(r) => { setSelectedId(null); setViewRow(r); }}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      </>}

      <AttendanceBulkBar
        open={!!selectedId}
        onView={() => {
          const row = rows.find((r) => r.id === selectedId);
          setSelectedId(null);
          if (row) setViewRow(row);
        }}
        onDelete={() => {
          const row = rows.find((r) => r.id === selectedId);
          setSelectedId(null);
          if (row) handleDeleteRequest(row);
        }}
        onClear={() => setSelectedId(null)}
      />

      <AttendanceViewPane
        row={viewRow}
        isOpen={!!viewRow}
        onClose={() => setViewRow(null)}
        goodThreshold={thresholds.good}
        atRiskThreshold={thresholds.atRisk}
      />
      <AttendanceDeleteBlockedModal
        isOpen={!!blockedRow}
        memberName={blockedRow?.member_name}
        onClose={() => setBlockedRow(null)}
      />
      <DeleteAttendanceRecordDialog
        row={deleteRow}
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
      />

      <ThresholdModal
        open={thresholdModal !== null}
        onOpenChange={(o) => { if (!o) setThresholdModal(null); }}
        which={thresholdModal || 'good'}
        value={thresholdModal ? thresholds[thresholdModal] : 0}
        onSave={(val) => saveThresholds({ [thresholdModal]: val })}
        isSaving={isSaving}
      />
    </div>
  );
}