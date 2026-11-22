import React from 'react';

const AGENTS = [
  { initials: 'AK', className: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200' },
  { initials: 'JR', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200' },
  { initials: 'SM', className: 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200' },
];

/** Featured "Start a chat" card at the top of the Help & Support menu. */
export default function HelpChatCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[18px] border border-blue-200/70 bg-gradient-to-br from-blue-100 via-blue-50 to-card p-[18px] text-left transition-shadow hover:shadow-[0_8px_22px_rgba(62,99,221,0.12)] dark:border-blue-400/20 dark:from-blue-500/15 dark:via-blue-500/5 dark:to-card dark:hover:shadow-[0_8px_22px_rgba(0,0,0,0.35)]"
    >
      <span className="pointer-events-none absolute -right-12 -top-16 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(91,141,239,0.28)_0%,rgba(91,141,239,0)_70%)]" />
      <span className="relative flex items-center justify-between">
        <span className="flex">
          {AGENTS.map((a, i) => (
            <span
              key={a.initials}
              className={`flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-card text-[11px] font-bold ${i ? '-ml-2' : ''} ${a.className}`}
            >
              {a.initials}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/75">
          <span className="h-[7px] w-[7px] rounded-full bg-emerald-400 ring-[3px] ring-emerald-400/20" />
          Online now
        </span>
      </span>
      <span className="relative mt-3.5 block">
        <span className="block text-lg font-semibold tracking-tight text-foreground">Start a chat</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground">Typically replies in a few minutes</span>
      </span>
    </button>
  );
}