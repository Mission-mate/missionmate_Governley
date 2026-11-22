import React from 'react';
import { actionFields } from '@/lib/whsHazardFields';
import { nextRecordCode } from '@/lib/whsApi';
import { ACTION_STAGES, OPEN_CLOSED } from '@/lib/whsRegister';
import HazardLinkedSection from './HazardLinkedSection';

const ACTION_COLUMNS = [
  { key: 'title', label: 'Action', kind: 'title', sub: 'action_required', width: '40%' },
  { key: 'owner', label: 'Owner', kind: 'person', width: '19%' },
  { key: 'due_date', label: 'Due Date', kind: 'date', overdue: true, width: '15%' },
  { key: 'stage', label: 'Stage', kind: 'pill', width: '14%' },
  { key: 'status', label: 'Status', kind: 'pill', width: '12%' },
];

/** Actions linked to one WHS source record, tabbed by Stage; rows open the shared view/edit side pane. */
export default function LinkedActionsSection({ cfg, registerId, sourceType, sourceId, sourceCode, focusId }) {
  const newAction = async () => ({
    action_code: await nextRecordCode('WhsAction', 'action_code', 'ACT', registerId),
    source_type: sourceType,
    register_id: registerId,
    status: 'Open',
    stage: 'Not Started',
  });
  return (
    <HazardLinkedSection entityName="WhsAction"
      link={{ register_id: registerId, source_type: sourceType, source_id: sourceId }}
      createExtra={{ source_code: sourceCode || '' }}
      noun="Action" title="Actions" subtitle="Manage and track the actions raised from this record."
      fields={actionFields(cfg)} columns={ACTION_COLUMNS} statuses={OPEN_CLOSED} stages={ACTION_STAGES}
      tabKey="stage" statusTabs={ACTION_STAGES}
      displayKey="title" newDefaults={newAction} focusId={focusId} />
  );
}