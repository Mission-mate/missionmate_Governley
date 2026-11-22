/** Group conversation colours — the same solid note palette, so groups and notes share one colour family. */
import { FOLDER_COLORS, FOLDER_COLOR_MAP } from '@/components/documents/FolderIcon';

export const GROUP_COLORS = FOLDER_COLORS;
export const DEFAULT_GROUP_COLOR = 'teal';

/** Solid fill for a group colour key — the exact shade the note badges use. */
export const groupColor = (key) => (FOLDER_COLOR_MAP[key] || FOLDER_COLOR_MAP[DEFAULT_GROUP_COLOR]).back;