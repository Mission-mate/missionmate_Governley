import { Quill } from 'react-quill';
import { Type, Heading1, Heading2, List, ListOrdered, CheckSquare, Minus } from 'lucide-react';

/**
 * Register a minimal <hr> block so the slash menu can insert a divider.
 * Quill ships no divider format out of the box.
 */
let registered = false;
export function registerNoteFormats() {
  if (registered) return;
  registered = true;
  const BlockEmbed = Quill.import('blots/block/embed');
  class DividerBlot extends BlockEmbed {}
  DividerBlot.blotName = 'divider';
  DividerBlot.tagName = 'hr';
  Quill.register(DividerBlot);
}

/**
 * Slash-command blocks. `format` is applied with Quill's formatLine;
 * `divider: true` inserts the embed instead.
 */
export const SLASH_BLOCKS = [
  { id: 'text', label: 'Text', hint: 'Plain paragraph', icon: Type, format: { header: false, list: false } },
  { id: 'h1', label: 'Heading 1', hint: 'Large section heading', icon: Heading1, format: { header: 1, list: false } },
  { id: 'h2', label: 'Heading 2', hint: 'Medium section heading', icon: Heading2, format: { header: 2, list: false } },
  { id: 'bullet', label: 'Bulleted list', hint: 'Simple bulleted list', icon: List, format: { header: false, list: 'bullet' } },
  { id: 'ordered', label: 'Numbered list', hint: 'Ordered step list', icon: ListOrdered, format: { header: false, list: 'ordered' } },
  { id: 'check', label: 'Checklist', hint: 'Track tasks with checkboxes', icon: CheckSquare, format: { header: false, list: 'unchecked' } },
  { id: 'divider', label: 'Divider', hint: 'Visually separate sections', icon: Minus, divider: true },
];