import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * LoaderOne — the application's default loading indicator.
 * Three dots that bounce, fade and scale in sequence.
 *
 * Props:
 * - size: 'sm' | 'md' | 'lg' — dot size (default 'md')
 * - className: extra classes on the wrapper
 * - dotClassName: override dot colour (default bg-primary)
 */
const SIZES = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export default function LoaderOne({ size = 'md', className, dotClassName }) {
  return (
    <div data-loader="" className={cn('flex items-center justify-center gap-1', className)}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={cn('rounded-full bg-primary', SIZES[size] || SIZES.md, dotClassName)}
          initial={{ x: 0 }}
          animate={{
            x: [0, 10, 0],
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}