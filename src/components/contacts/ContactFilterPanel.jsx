import React, { useState } from 'react';
import { Check, ChevronLeft, X, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useToast } from '@/components/ui/use-toast';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import SectionLoader from '@/components/shared/states/SectionLoader';
import { cn } from '@/lib/utils';
import { getTagPillClasses } from '@/lib/tagColors';

function OptionRow({ label, selected, onClick, children }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm cursor-pointer hover:bg-accent',
        selected && 'bg-accent/50'
      )}
    >
      {children || <span>{label}</span>}
      {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
    </div>
  );
}

/**
 * Filter panel for contacts: pick Contact Type and/or Tags (multi-select),
 * and optionally save the selection as a Smart Group.
 */
export default function ContactFilterPanel({ filters, onApply, onClose, onSaveSmartList }) {
  const { toast } = useToast();
  const { config: ctConfig, isLoading: ctConfigLoading } = useContactTypeConfig();
  const { fields: customFields } = useCustomFields('contacts');
  const { data: allTags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list(),
  });

  // Only fields shown as columns in the database, and only those with selectable options.
  const filterableFields = customFields.filter(
    (f) => f.isVisibleInDatabase && Array.isArray(f.options) && f.options.length > 0
  );

  const [view, setView] = useState('root'); // root | contactType | tags | custom-<fieldId>
  const [selTypes, setSelTypes] = useState(filters.contactTypes || []);
  const [selTags, setSelTags] = useState(filters.tags || []);
  const [selCustom, setSelCustom] = useState(filters.custom || {});
  const [savingName, setSavingName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const toggle = (list, setList, val) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const toggleCustom = (fieldId, val) =>
    setSelCustom((prev) => {
      const current = prev[fieldId] || [];
      const next = current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
      return { ...prev, [fieldId]: next };
    });

  const currentFilters = () => ({ contactTypes: selTypes, tags: selTags, custom: selCustom });

  const apply = () => {
    onApply(currentFilters());
    onClose();
  };

  const clearAll = () => {
    setSelTypes([]);
    setSelTags([]);
    setSelCustom({});
    onApply({ contactTypes: [], tags: [], custom: {} });
  };

  const handleSave = async () => {
    if (!savingName.trim()) return;
    await onSaveSmartList(savingName.trim(), currentFilters());
    toast({ title: 'Smart group saved', description: `"${savingName.trim()}" added to Groups.` });
    setSavingName('');
    setShowSave(false);
  };

  const customCount = Object.values(selCustom).reduce((sum, v) => sum + (v?.length || 0), 0);
  const activeCount = selTypes.length + selTags.length + customCount;
  const activeField = view.startsWith('custom-')
    ? filterableFields.find((f) => f.id === view.slice('custom-'.length))
    : null;

  return (
    <div className="animate-dropdown-enter absolute z-50 top-full mt-2 right-0 w-72 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
      {view === 'root' && (
        <div className="p-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter By</div>
          <button onClick={() => setView('contactType')} className="w-full flex items-center justify-between rounded-md px-2.5 py-2.5 text-sm hover:bg-accent">
            <span>Contact Type</span>
            {selTypes.length > 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{selTypes.length}</span>}
          </button>
          <button onClick={() => setView('tags')} className="w-full flex items-center justify-between rounded-md px-2.5 py-2.5 text-sm hover:bg-accent">
            <span>Tags</span>
            {selTags.length > 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{selTags.length}</span>}
          </button>
          {filterableFields.map((f) => (
            <button key={f.id} onClick={() => setView(`custom-${f.id}`)} className="w-full flex items-center justify-between rounded-md px-2.5 py-2.5 text-sm hover:bg-accent">
              <span>{f.name}</span>
              {(selCustom[f.id]?.length || 0) > 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{selCustom[f.id].length}</span>}
            </button>
          ))}

          {showSave ? (
            <div className="border-t border-border mt-2 pt-2 px-1 space-y-2">
              <Input
                autoFocus
                placeholder="Smart group name"
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 flex-1 text-xs" onClick={handleSave} disabled={!savingName.trim() || activeCount === 0}>Save</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowSave(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              disabled={activeCount === 0}
              className="w-full flex items-center gap-2 rounded-md px-2.5 py-2.5 text-sm text-primary hover:bg-accent border-t border-border mt-2 pt-2.5 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" /> Save as Smart Group
            </button>
          )}

          <FilterFooter className="mt-2 -mx-2 -mb-2" onClear={clearAll} onApply={apply} count={activeCount} />
        </div>
      )}

      {view === 'contactType' && (
        <div className="p-2">
          <button onClick={() => setView('root')} className="flex items-center gap-1 text-sm font-medium px-1.5 py-1.5 hover:text-primary">
            <ChevronLeft className="w-4 h-4" /> Contact Type
          </button>
          <div className="max-h-64 overflow-y-auto mt-1">
            {ctConfigLoading ? (
              <SectionLoader />
            ) : ctConfig.options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground text-center">No contact types defined.</p>
            ) : (
              ctConfig.options.map((o) => (
                <OptionRow key={o.value} label={o.label} selected={selTypes.includes(o.value)} onClick={() => toggle(selTypes, setSelTypes, o.value)} />
              ))
            )}
          </div>
          <Button size="sm" className="h-8 w-full text-xs mt-2" onClick={apply}>Apply</Button>
        </div>
      )}

      {view === 'tags' && (
        <div className="p-2">
          <button onClick={() => setView('root')} className="flex items-center gap-1 text-sm font-medium px-1.5 py-1.5 hover:text-primary">
            <ChevronLeft className="w-4 h-4" /> Tags
          </button>
          <div className="max-h-64 overflow-y-auto mt-1">
            {tagsLoading ? (
              <SectionLoader />
            ) : allTags.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground text-center">No tags created yet.</p>
            ) : (
              allTags.map((t) => (
                <OptionRow
                  key={t.id}
                  selected={selTags.includes(t.id)}
                  onClick={() => toggle(selTags, setSelTags, t.id)}
                >
                  <span className={getTagPillClasses(t.color)}>{t.name}</span>
                </OptionRow>
              ))
            )}
          </div>
          <Button size="sm" className="h-8 w-full text-xs mt-2" onClick={apply}>Apply</Button>
        </div>
      )}

      {activeField && (
        <div className="p-2">
          <button onClick={() => setView('root')} className="flex items-center gap-1 text-sm font-medium px-1.5 py-1.5 hover:text-primary">
            <ChevronLeft className="w-4 h-4" /> {activeField.name}
          </button>
          <div className="max-h-64 overflow-y-auto mt-1">
            {activeField.options.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={(selCustom[activeField.id] || []).includes(o.value)}
                onClick={() => toggleCustom(activeField.id, o.value)}
              />
            ))}
          </div>
          <Button size="sm" className="h-8 w-full text-xs mt-2" onClick={apply}>Apply</Button>
        </div>
      )}
    </div>
  );
}