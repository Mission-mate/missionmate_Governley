import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ObjectConfigTab from './ObjectConfigTab';

// Modules whose custom fields are managed from this dedicated hub.
// Add more here later (e.g. { id: 'grants', label: 'Grant Fields' }).
const FIELD_TABS = [
  { id: 'contacts', label: 'Contacts Fields' },
  { id: 'membership', label: 'Membership Fields' },
];

export default function CustomFields() {
  const [activeTab, setActiveTab] = useState('contacts');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10">
          <Sparkles size={26} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Fields</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage the custom fields for each module in one place.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border mb-6">
        {FIELD_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {FIELD_TABS.map((tab) =>
        activeTab === tab.id ? <ObjectConfigTab key={tab.id} objectId={tab.id} /> : null
      )}
    </div>
  );
}