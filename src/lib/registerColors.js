// Shared 5-tint option palette — bg/text/dot class triplets used by register-style
// select badges. Kept in lib so it survives independently of any one grid module.
// Each tint carries a muted dark-mode variant so pastel pills don't glow on dark
// surfaces. Classes are written as literal strings so Tailwind can find them.
export const OPTION_COLORS = [
  { id: 'blue',   bg: 'bg-blue-100 dark:bg-blue-400/15',     text: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-400'   },
  { id: 'green',  bg: 'bg-green-100 dark:bg-green-400/15',   text: 'text-green-700 dark:text-green-300',   dot: 'bg-green-400'  },
  { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-400/15', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
  { id: 'red',    bg: 'bg-red-100 dark:bg-red-400/15',       text: 'text-red-700 dark:text-red-300',       dot: 'bg-red-400'    },
  { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-400/15', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-400' },
  { id: 'gray',   bg: 'bg-gray-100 dark:bg-gray-400/15',     text: 'text-gray-700 dark:text-gray-300',     dot: 'bg-gray-400'   },
];

// Checkbox / symbol presentation styles for select-style register columns.
export const CHECKBOX_STYLES = [
  { id: 'checkbox', label: 'Checkbox', preview: '☑' },
  { id: 'flag',     label: 'Flag',     preview: '🚩' },
  { id: 'star',     label: 'Star',     preview: '⭐' },
];

export const SYMBOL_STYLES = [
  { id: 'traffic_light', label: 'Traffic Light', symbols: ['🔴','🟠','🟢','🔵'] },
  { id: 'status_icons',  label: 'Status Icons',  symbols: ['✅','ℹ️','❌'] },
  { id: 'arrows',        label: 'Arrows',        symbols: ['↓','↘','↗','↑'] },
  { id: 'stars',         label: 'Stars',         symbols: ['⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'] },
  { id: 'faces',         label: 'Faces',         symbols: ['😊','🙂','😐','🙁','😞'] },
];