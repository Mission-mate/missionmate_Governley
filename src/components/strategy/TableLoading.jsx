import React from 'react';
import { LoaderOne } from '@/components/ui/loaders';

/** Loading state shown in place of a strategy table or chart until its data is ready. */
export default function TableLoading() {
  return (
    <div className="border border-border rounded-lg bg-card py-10 flex items-center justify-center">
      <LoaderOne />
    </div>
  );
}