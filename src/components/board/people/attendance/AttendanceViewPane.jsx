import React from 'react';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SectionCard from '@/components/shared/SectionCard';
import AttendanceRateBar from './AttendanceRateBar';

function ViewField({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>);

}

/** Read-only slide pane mirroring the attendance table's summary fields. */
export default function AttendanceViewPane({ row, isOpen, onClose, goodThreshold = 75, atRiskThreshold = 50 }) {
  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {row &&
      <div
        className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="min-w-0">
              <h2 className="font-bold text-lg truncate">{row.member_name}</h2>
              <p className="text-xs text-muted-foreground truncate">Attendance record</p>
            </div>
            <PaneIconHeaderActions showEdit={false} onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <SectionCard className="grid grid-cols-2 gap-x-4 gap-y-5">
              <ViewField label="Member">{row.member_name}</ViewField>
              <ViewField label="Position">{row.position || 'Member'}</ViewField>
              <ViewField label="Meetings Invited">{row.total}</ViewField>
              <ViewField label="Meetings Attended">{row.present}/{row.total}</ViewField>
              <ViewField label="Apologies">
                <span className="font-medium text-amber-600 dark:text-amber-400">{row.apology}</span>
              </ViewField>
              <ViewField label="Absences">
                <span className="font-medium text-destructive">{row.absent}</span>
              </ViewField>
              <div className="col-span-2">
                <ViewField label="Attendance Rate">
                  <AttendanceRateBar fullWidth rate={row.rate} goodThreshold={goodThreshold} atRiskThreshold={atRiskThreshold} />
                </ViewField>
              </div>
            </SectionCard>
          </div>
        </div>
      }
    </SlidePane>);

}