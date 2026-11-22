import React from 'react';
import ModuleTile from '@/components/shared/ModuleTile';
import GenieAvatar from './GenieAvatar';

/** A copilot's icon: Genie's animated face, or the module's solid colour tile. */
export default function CopilotIcon({ copilot, size, className }) {
  if (copilot.id === 'genie') return <GenieAvatar size={size} className={className} />;
  return <ModuleTile bg={copilot.bg} icon={copilot.icon} size={size} className={className} />;
}