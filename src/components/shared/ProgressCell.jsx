import React from 'react';
import ProgressBar from '@/components/risk/ProgressBar';

/**
 * Reusable Progress % display used by register-style tables
 * (Risk treatment register, Level 5 tasks & milestones).
 */
export default function ProgressCell({ value = 0, className }) {
  return <ProgressBar value={value} showLabel className={className} />;
}