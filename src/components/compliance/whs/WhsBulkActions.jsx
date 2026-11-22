import React, { useState } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RowBulkBar from '@/components/risk/register/RowBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { STATUS_DOT } from '@/lib/whsTabs';
import { saveWhsSource, deleteWhsSource } from '@/lib/whsLifecycle';
import { invalidateWhsRegister } from '@/lib/whsApi';
import { ACTION_STAGES } from '@/lib/whsRegister';

/** Floating action bar + delete confirmation for a WHS register tab selection. */
export default function WhsBulkActions({ cfg, selected, onOpen, onEdit, onClear }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const n = selected.length;
  const done = () => { onClear(); invalidateWhsRegister(qc); qc.invalidateQueries({ queryKey: ['whsCount'] }); };

  const changeField = guardAction(async (patch) => {
    await Promise.all(selected.map((r) => (cfg.sourceType
      ? saveWhsSource(cfg.sourceType, r.id, patch)
      : base44.entities[cfg.entity].update(r.id, patch))));
    done();
  }, 'Could not update the record');
  const remove = guardAction(async () => {
    await Promise.all(selected.map((r) => (cfg.sourceType
      ? deleteWhsSource(cfg.sourceType, r.id)
      : base44.entities[cfg.entity].delete(r.id))));
    setConfirm(false);
    done();
  }, 'Could not delete the record');
  const noun = n === 1 ? cfg.noun : cfg.label.toLowerCase();
  const linked = cfg.sourceType ? ' and all linked records' : '';

  return (
    <>
      <RowBulkBar count={n} onView={() => onOpen(selected[0])} onEdit={() => (onEdit || onOpen)(selected[0])}
        statusOptions={cfg.statuses.map((s) => ({ value: s, dot: STATUS_DOT[s] }))} onChangeStatus={(status) => changeField({ status })}
        stageOptions={cfg.sourceType ? undefined : ACTION_STAGES.map((s) => ({ value: s, dot: STATUS_DOT[s] }))}
        onChangeStage={(stage) => changeField({ stage })}
        onDelete={cfg.sourceType ? () => setConfirm(true) : undefined} onClear={onClear} />
      <ConfirmTypeDialog isOpen={confirm} title={`Delete ${n} ${noun}`} keyword="DELETE" confirmLabel="Delete"
        message={`Permanently delete ${n} ${noun}${linked}? This cannot be undone.`}
        onConfirm={remove} onClose={() => setConfirm(false)} />
    </>
  );
}