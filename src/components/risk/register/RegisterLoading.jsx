import React from 'react';
import { LoaderOne } from '@/components/ui/loaders';
import { cn } from '@/lib/utils';
import { RISK_TABLE } from '@/components/risk/riskSurfaces';

/** Loading placeholder shown inside a risk register table area while data loads. */
export default function RegisterLoading() {
  return (
    <div className={cn(RISK_TABLE, 'py-16 flex items-center justify-center')}>
      <LoaderOne size="lg" />
    </div>
  );
}