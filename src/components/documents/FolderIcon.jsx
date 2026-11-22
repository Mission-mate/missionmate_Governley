/**
 * FolderIcon — renders a realistic two-tone folder SVG in the chosen colour.
 * Colors inspired by the macOS-style folder palette.
 */
import React from 'react';

export const FOLDER_COLORS = [
  { key: 'orange',  back: '#E8845A', front: '#F5A57A', tab: '#D4693F' },
  { key: 'yellow',  back: '#E8C84A', front: '#F5DC70', tab: '#D4AE2F' },
  { key: 'green',   back: '#7AB87A', front: '#9FCC9F', tab: '#5E9E5E' },
  { key: 'teal',    back: '#5AACB8', front: '#7ECAD4', tab: '#3E909E' },
  { key: 'lavender',back: '#A08AC8', front: '#BEAADC', tab: '#8470B0' },
];

export const FOLDER_COLOR_MAP = Object.fromEntries(FOLDER_COLORS.map(c => [c.key, c]));

export default function FolderIcon({ color = 'orange', size = 20 }) {
  const c = FOLDER_COLOR_MAP[color] || FOLDER_COLOR_MAP.orange;
  const w = size;
  const h = size * 0.82;

  return (
    <svg width={w} height={h} viewBox="0 0 20 16.4" xmlns="http://www.w3.org/2000/svg">
      {/* Back panel */}
      <rect x="0" y="3.2" width="20" height="13.2" rx="1.4" fill={c.back} />
      {/* Tab */}
      <path d="M0 4.4 Q0 3.2 1.4 3.2 L7.2 3.2 Q8.4 3.2 8.9 2.1 L9.4 1.1 Q9.9 0 11.1 0 L18.6 0 Q20 0 20 1.4 L20 4.4 Z" fill={c.tab} />
      {/* Front panel */}
      <rect x="0" y="5.2" width="20" height="11.2" rx="1.4" fill={c.front} />
    </svg>
  );
}