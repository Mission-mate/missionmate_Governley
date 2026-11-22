import React from 'react';
import { Input } from '@/components/ui/input';

/** Whole-number currency input that displays thousand separators, e.g. 200,000. */
export default function CurrencyInput({ value, onChange, placeholder = '$' }) {
  const display = value === '' || value === null || value === undefined
    ? ''
    : Number(value).toLocaleString('en-US');

  return (
    <Input
      inputMode="numeric"
      value={display}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, '');
        onChange(digits === '' ? '' : Number(digits));
      }}
      className="text-sm bg-white dark:bg-card"
      placeholder={placeholder}
    />
  );
}