import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERMISSION_CONFIG } from '@/lib/permissions';

/** Tinted green (on) / red (off) toggle. */
function Toggle({ checked, disabled, locked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || locked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${disabled ? 'opacity-50' : ''} ${locked ? 'cursor-default' : 'disabled:cursor-not-allowed'} ${
        checked ? 'bg-green-500' : 'bg-red-400'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function StaffPermissionsStep({ accessControl, onAccessControlChange, permissions, onToggle, readOnly = false }) {
  const isFull = accessControl === 'full';
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm mb-1.5 block">Access Control</Label>
        <Select value={accessControl} onValueChange={onAccessControlChange} disabled={readOnly}>
          <SelectTrigger className="disabled:opacity-100 disabled:cursor-default"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Access</SelectItem>
            <SelectItem value="restricted">Restricted Access</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          {isFull
            ? 'Full Access enables every module. Switch to Restricted Access to control items individually.'
            : 'Toggle on the modules and submodules this person can access.'}
        </p>
      </div>

      <div className="space-y-3">
        {PERMISSION_CONFIG.map((mod) => {
          const hasChildren = mod.children && mod.children.length > 0;
          const isOpen = !!expanded[mod.id];
          return (
            <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <button
                  type="button"
                  onClick={() => hasChildren && toggleExpand(mod.id)}
                  className={`flex items-center gap-1.5 text-sm font-semibold text-foreground ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {hasChildren && (isOpen
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
                  {mod.label}
                </button>
                <Toggle
                  checked={!!permissions[mod.id]}
                  disabled={isFull}
                  locked={readOnly}
                  onChange={(v) => onToggle(mod, null, v)}
                />
              </div>
              {hasChildren && isOpen && (
                <div className="divide-y divide-border">
                  {mod.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-9">
                      <span className="text-sm text-muted-foreground">{child.label}</span>
                      <Toggle
                        checked={!!permissions[`${mod.id}.${child.id}`]}
                        disabled={isFull}
                        locked={readOnly}
                        onChange={(v) => onToggle(mod, child, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}