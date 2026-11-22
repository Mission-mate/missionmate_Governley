import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Same spring family as the capsule switchers — snappy, restrained settle.
const SPRING = { type: 'spring', stiffness: 500, damping: 30, mass: 1 };

/**
 * Shared selection circle (the control that drives floating action bars).
 * Subtle lift + soft shadow on hover, spring squash on press, and the tick
 * springs in when selected. Motion is disabled for reduced-motion users.
 */
export default function SpringCircleButton({ as = 'button', active, onClick, title, className, activeClassName, idleClassName, iconClassName, strokeWidth }) {
  const reduce = useReducedMotion();
  // `as="span"` renders a presentational indicator for use inside a clickable parent.
  const Root = as === 'span' ? motion.span : motion.button;
  return (
    <Root
      {...(as === 'span' ? {} : { type: 'button' })}
      onClick={onClick}
      title={title}
      whileHover={reduce ? undefined : { y: -1.5 }}
      whileTap={reduce ? undefined : { scale: 0.86 }}
      transition={SPRING}
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-[background-color,border-color,box-shadow] duration-150',
        'hover:shadow-[0_2px_6px_hsl(var(--foreground)/0.16)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
        className,
        active ? activeClassName : idleClassName
      )}
    >
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            key="tick"
            className="flex"
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0, opacity: 0, transition: { duration: 0.1 } }}
            transition={SPRING}
          >
            <Check className={cn('w-3 h-3', iconClassName)} strokeWidth={strokeWidth} />
          </motion.span>
        )}
      </AnimatePresence>
    </Root>
  );
}