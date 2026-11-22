import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import PlanRichText from './PlanRichText';

const newSection = () => ({
  id: `sec_${crypto.randomUUID()}`,
  title: '',
  content: ''
});

// Dynamic list of customisable rich-text content sections (e.g. Membership
// Rights, Membership Benefits) shown to new members on signup.
export default function PlanContentSections({ sections = [], onChange }) {
  const add = () => onChange([...sections, newSection()]);
  const remove = (id) => onChange(sections.filter((s) => s.id !== id));
  const update = (id, patch) =>
  onChange(sections.map((s) => s.id === id ? { ...s, ...patch } : s));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold text-foreground">Additional Sections</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Use sections to explain membership rights, benefits, terms and more. 

          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 shrink-0 bg-primary text-primary-foreground border-0 shadow-sm hover:shadow-md hover:bg-primary/90 hover:text-primary-foreground transition-shadow">
          <Plus className="w-4 h-4" /> Add Section
        </Button>
      </div>

      {sections.length === 0 ?
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No additional sections yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Additional sections will be displayed to new members on signup.
        </p>
        </div> :
      <div className="space-y-4">
          {sections.map((sec) =>
        <div key={sec.id} className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                <Input
              value={sec.title}
              onChange={(e) => update(sec.id, { title: e.target.value })}
              placeholder="Section name, e.g. Membership Benefits"
              className="flex-1 font-medium" />
            
                <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(sec.id)}
              className="text-muted-foreground hover:text-destructive shrink-0">
              
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <PlanRichText
            value={sec.content}
            onChange={(html) => update(sec.id, { content: html })}
            placeholder="Write the content for this section. You can add links and formatting." />
          
            </div>
        )}
        </div>
      }
    </div>);

}