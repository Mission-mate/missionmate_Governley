import React from 'react';
import OptionBadge from '@/components/board/registers/OptionBadge';
import { OPTION_COLORS } from '@/lib/registerColors';
import { OUTCOME_OPTIONS, STATUS_OPTIONS } from '@/lib/decisions';

function ToneBadge({ options, value }) {
  if (!value) return <span className="text-sm text-muted-foreground/50">—</span>;
  const color = options.find((o) => o.name === value)?.color;
  const tone = OPTION_COLORS.find((c) => c.id === color);
  return <OptionBadge label={value} bg={tone?.bg} text={tone?.text} />;
}

export function OutcomeBadge({ outcome }) {
  return <ToneBadge options={OUTCOME_OPTIONS} value={outcome} />;
}

export function DecisionStatusBadge({ status }) {
  return <ToneBadge options={STATUS_OPTIONS} value={status} />;
}