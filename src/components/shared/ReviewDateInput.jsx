import React from 'react';
import DateField from '@/components/ui/DateField';

/**
 * Standard date input for selecting the next review date.
 */
export default function ReviewDateInput({ value, onChange }) {
  return <DateField value={value || ''} onChange={onChange} />;
}