import React from 'react';
import { cn } from '@/lib/utils';

const KIND_BY_EXT = { doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel', pdf: 'pdf' };
const KIND_CLASS = {
  word: 'bg-blue-600',
  excel: 'bg-green-600',
  pdf: 'bg-red-500',
  other: 'bg-amber-500',
};

/** Small coloured file tile labelled with the file's extension (Word blue, Excel green, PDF red, rest amber). */
export default function FileTypeIcon({ fileName }) {
  const ext = fileName?.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  return (
    <span className={cn('relative w-9 h-9 rounded-md shrink-0 overflow-hidden flex items-end justify-center pb-1 text-[9px] font-bold tracking-wide text-primary-foreground', KIND_CLASS[KIND_BY_EXT[ext] || 'other'])}>
      <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-bl-md bg-primary-foreground/40" />
      {(ext || 'file').slice(0, 4).toUpperCase()}
    </span>
  );
}