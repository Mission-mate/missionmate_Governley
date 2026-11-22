import React from 'react';
import { FileText } from 'lucide-react';
import { FOLDER_COLOR_MAP } from '@/components/documents/FolderIcon';

export const DEFAULT_NOTE_COLOR = 'orange';

/** Circular note badge in one of the five folder palette colours, with a white page glyph. */
export default function NoteIcon({ color, size = 28 }) {
  // 'blue' is the single-page notes badge; it follows the theme's primary colour.
  const background = color === 'blue'
    ? 'hsl(var(--primary))'
    : (FOLDER_COLOR_MAP[color] || FOLDER_COLOR_MAP[DEFAULT_NOTE_COLOR]).back;
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-full text-white shadow-sm"
      style={{ width: size, height: size, background }}>
      <FileText style={{ width: size / 2, height: size / 2 }} strokeWidth={2.5} />
    </span>
  );
}