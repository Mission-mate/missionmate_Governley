import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

const newTier = () => ({
  id: `tier_${crypto.randomUUID()}`,
  name: '',
  description: '',
  fee_amount: 0
});

// Configure categories/tiers for a plan, with optional per-tier fees.
export default function PlanTiersConfig({ form, setForm }) {
  const tiers = form.tiers || [];
  const setTiers = (next) => setForm((f) => ({ ...f, tiers: next }));

  const add = () => setTiers([...tiers, newTier()]);
  const remove = (id) => setTiers(tiers.filter((t) => t.id !== id));
  const update = (id, patch) => setTiers(tiers.map((t) => t.id === id ? { ...t, ...patch } : t));

  return (
    <div className="rounded-xl bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch
            id="has_tiers"
            checked={!!form.has_tiers}
            onCheckedChange={(v) => setForm((f) => ({ ...f, has_tiers: !!v }))} />

          <div>
            <Label htmlFor="has_tiers" className="text-sm font-semibold text-foreground cursor-pointer">
              Create multiple tiers (categories) for this membership plan.
            </Label>
            <p className="text-xs text-muted-foreground mt-1">E.g. Individual & family, tiers based on annual turnover, number of employees or organisation size.

            </p>
          </div>
        </div>
      </div>

      {form.has_tiers &&
      <div className="space-y-4 pl-7">
          <div className="space-y-3">
            {tiers.map((t) =>
          <div key={t.id} className="rounded-lg bg-muted/40 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                value={t.name}
                onChange={(e) => update(t.id, { name: e.target.value })}
                placeholder="Tier Name"
                className="flex-1 font-medium" />
              
                  <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(t.id)}
                className="text-muted-foreground hover:text-destructive shrink-0">
                
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
              value={t.description}
              onChange={(e) => update(t.id, { description: e.target.value })}
              placeholder="Tier description (Optional)" />
            
              </div>
          )}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 bg-primary text-primary-foreground border-0 shadow-sm hover:shadow-md hover:bg-primary/90 hover:text-primary-foreground transition-shadow">
            <Plus className="w-4 h-4" /> Add Tier
          </Button>
        </div>
      }
    </div>);

}