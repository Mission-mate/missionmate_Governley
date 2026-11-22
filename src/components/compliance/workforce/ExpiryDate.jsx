import React from 'react';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { daysToExpiry, EXPIRY_WARNING_DAYS } from '@/lib/workforceRegister';

const days = (n) => `${n} day${n === 1 ? '' : 's'}`;

/** Expiry date with a red "X days ago" when expired, or amber "Expires in X days" within the warning window (Active credentials only). */
export default function ExpiryDate({ row }) {
  if (!row) return <span className="text-sm text-muted-foreground">—</span>;
  const d = daysToExpiry(row);
  if (d === null) return <p className="text-sm text-muted-foreground">No expiry</p>;
  // Archived credentials are no longer tracked — show the plain date only.
  if (row.status === 'Archived') return <p className="text-sm text-foreground">{formatReviewDate(row.expiry_date)}</p>;
  const expired = d < 0;
  return (
    <div>
      <p className={`text-sm ${expired ? 'text-destructive font-medium' : 'text-foreground'}`}>{formatReviewDate(row.expiry_date)}</p>
      {expired && <p className="text-xs font-semibold text-destructive mt-0.5">{days(-d)} ago</p>}
      {!expired && d <= EXPIRY_WARNING_DAYS && (
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{d === 0 ? 'Expires today' : `Expires in ${days(d)}`}</p>
      )}
    </div>
  );
}