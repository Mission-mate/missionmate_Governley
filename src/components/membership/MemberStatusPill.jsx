import React from 'react';
import { badgeTone } from '@/lib/statusBadge';

const STATUS_STYLES = {
  active: badgeTone('green'),
  pending: badgeTone('amber'),
  expired: badgeTone('red'),
};

/** Coloured membership-status pill — shared by the members table and forms. */
export default function MemberStatusPill({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '–';
  return (
    <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_STYLES[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {label}
    </span>
  );
}