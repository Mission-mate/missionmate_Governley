import React, { useState } from 'react';
import { Search, Check, Library } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { REGISTER_TEMPLATES } from '@/lib/complianceRegisterTemplates';

/**
 * Type step of the Add New Register flow — pick one pre-built register
 * template from the read-only register library.
 */
export default function RegisterTypeStep({ value, onSelect }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const items = q ?
  REGISTER_TEMPLATES.filter((t) => t.title.toLowerCase().includes(q)) :
  REGISTER_TEMPLATES;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Library className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select a register from the register library below</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search registers..."
          className="pl-9 bg-white" />
        
      </div>

      <div className="space-y-2">
        {items.map((t) => {
          const selected = value === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(selected ? '' : t.id)}
              className={cn(
                'w-full text-left rounded-xl p-3.5 bg-card flex items-start justify-between gap-3 transition-all',
                selected ?
                'ring-2 ring-primary shadow-md' :
                'border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5'
              )}>
              
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full text-primary-foreground flex items-center justify-center shrink-0 bg-primary">
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center',
                  selected ? 'bg-primary text-primary-foreground' : 'border border-border'
                )}>
                
                {selected && <Check className="w-3 h-3" />}
              </span>
            </button>);

        })}
        {items.length === 0 &&
        <p className="text-sm text-muted-foreground py-8 text-center">No registers match your search.</p>
        }
      </div>
    </div>);

}