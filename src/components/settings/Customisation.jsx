import React from 'react';
import ObjectsTab from './ObjectsTab';

export default function Customisation() {
  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold text-foreground mb-1">Customisation</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Configure settings and manage active modules across your workspace.
      </p>

      <ObjectsTab />
    </div>
  );
}