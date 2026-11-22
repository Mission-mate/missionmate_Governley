import React from 'react';
import { CalendarDays, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import FileTypeIcon from '@/components/documents/FileTypeIcon';

// Agenda blue, Minutes orange (the same amber as the PNG / other file tile).
const TYPE_TILES = {
  agenda: { Icon: CalendarDays, className: 'bg-primary', label: 'Agenda' },
  minutes: { Icon: FileText, className: 'bg-amber-500', label: 'Minutes' },
};

/** Meeting document tile: filled Agenda / Minutes tiles, otherwise the file-format icon. */
export default function MeetingDocumentIcon({ doc }) {
  const tile = TYPE_TILES[doc.doc_type];
  if (!tile) return <FileTypeIcon fileName={doc.file_name} />;
  const { Icon, className, label } = tile;
  return (
    <span title={label} className={cn('w-9 h-9 rounded-md shrink-0 flex items-center justify-center text-primary-foreground', className)}>
      <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
    </span>
  );
}