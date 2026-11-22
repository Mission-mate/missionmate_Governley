import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useAppearance } from '@/lib/AppearanceContext';
import { cn } from '@/lib/utils';
import usePillTransition from '@/hooks/usePillTransition';

const OPTIONS = [
  { value: 'light', label: 'Light mode', Icon: Sun, activeClass: 'text-amber-500' },
  { value: 'dark', label: 'Dark mode', Icon: Moon, activeClass: 'text-blue-400' },
];

/**
 * Light / dark capsule switcher. The selected pill springs to the chosen option
 * (shared layoutId), icon colours fade in step, and the pill dips to 0.97 while pressed.
 */
export default function ThemeTogglePill() {
  const { theme, setTheme } = useAppearance();
  const pillId = `theme-pill-${useId()}`;
  const { transition, arm, reduceMotion } = usePillTransition();
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);

  return (
    <div className="flex items-center rounded-full p-0.5 gap-0.5 bg-muted mr-1 transition-colors duration-300 motion-reduce:transition-none">
      {OPTIONS.map(({ value, label, Icon, activeClass }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => { arm(); setTheme(value); }}
            onPointerDown={() => { arm(); setPressed(true); }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={cn(
              'relative w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 motion-reduce:transition-none',
              active ? activeClass : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                animate={{ scale: pressed && !reduceMotion ? 0.97 : 1 }}
                transition={transition}
                className="absolute inset-0 rounded-full bg-[hsl(var(--tab-active))] shadow-sm dark:shadow-black/30"
              />
            )}
            <Icon className="relative z-10 w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}