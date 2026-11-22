import React, { useEffect, useState } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AutoGrowTextarea from '@/components/strategy/level5/tasks/detail/AutoGrowTextarea';
import { useToast } from '@/components/ui/use-toast';
import SlidePane from '@/components/ui/SlidePane';
import BannerUploader from './BannerUploader';
import SocialLinksConfig from './SocialLinksConfig';
import SectionCard from '@/components/shared/SectionCard';

const REQUIRED_FIELDS = [
  { key: 'organisation_name', label: 'Organisation Name' },
  { key: 'title', label: 'Membership Page Title' },
  { key: 'description', label: 'Description' },
  { key: 'support_email', label: 'Membership Support Email' },
  { key: 'success_message', label: 'Success Message' },
];

// The page-level fields this pane edits.
const SETTINGS_KEYS = ['organisation_name', 'title', 'description', 'support_email', 'success_message', 'banner_url', 'status', 'social_links'];
const pickSettings = (form) => Object.fromEntries(SETTINGS_KEYS.map((k) => [k, form?.[k]]));

/**
 * Right slide-in pane holding the membership form's core details:
 * submissions toggle, banner, title, description and success message.
 * Edits the shared form state via the `update` callback.
 */
export default function FormSettingsPane({ isOpen, onClose, onCancel, form, update, onRestore, onSave, saving }) {
  const { toast } = useToast();
  const [baseline, setBaseline] = useState(() => pickSettings(form));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isOpen) setBaseline(pickSettings(form)); }, [isOpen]);

  // Discard puts only this pane's fields back to their values at open time.
  const { requestClose, dialog } = useUnsavedChanges({
    draft: pickSettings(form), baseline, saving, enabled: isOpen,
    onClose: () => { onRestore?.(baseline); onClose(); },
  });

  const handleSave = async () => {
    const missing = REQUIRED_FIELDS.filter((f) => !String(form[f.key] || '').trim());
    if (missing.length) {
      toast({
        title: 'Missing required fields',
        description: `Please complete: ${missing.map((f) => f.label).join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }
    await onSave?.();
    onClose();
  };

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="h-full bg-card border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Membership Page Settings</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={requestClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Allow submissions */}
          <SectionCard className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Allow Submissions</Label>
              <p className="text-xs text-muted-foreground">Turn off to stop the membership page from accepting new applications.</p>
            </div>
            <Switch
              checked={form.status === 'active'}
              onCheckedChange={(v) => update('status', v ? 'active' : 'disabled')} />
            
          </SectionCard>

          <div>
            <Label className="mb-1.5 block text-sm">Banner Image</Label>
            <BannerUploader value={form.banner_url} onChange={(url) => update('banner_url', url)} />
            <p className="text-xs text-muted-foreground mt-1.5">*Recommended Banner Size 1920 × 1080 pixels</p>
          </div>
          <SectionCard className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">Organisation Name <span className="text-destructive">*</span></Label>
            <Input value={form.organisation_name || ''} onChange={(e) => update('organisation_name', e.target.value)} placeholder="Your organisation name" className="bg-card" />
            <p className="text-xs text-muted-foreground mt-1.5">Displayed on the membership page</p>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Membership Page Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="E.g. Become a Member" className="bg-card" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Description <span className="text-destructive">*</span></Label>
            <AutoGrowTextarea value={form.description} onChange={(v) => update('description', v)} placeholder="Provide a brief description about the organisation." className="min-h-[80px] rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Membership Support Email <span className="text-destructive">*</span></Label>
            <Input type="email" value={form.support_email || ''} onChange={(e) => update('support_email', e.target.value)} placeholder="E.g. Info@organisation-domain.com" className="bg-card" />
            <p className="text-xs text-muted-foreground mt-1.5">Displayed on the membership page as support email for enquiries.</p>
          </div>
          </SectionCard>
          <SectionCard>
            <SocialLinksConfig value={form.social_links} onChange={(v) => update('social_links', v)} />
          </SectionCard>
          <SectionCard>
            <Label className="mb-1.5 block text-sm">Success Message <span className="text-destructive">*</span></Label>
            <AutoGrowTextarea value={form.success_message} onChange={(v) => update('success_message', v)} placeholder="Thank you! Your membership application has been received and you'll hear back from us within 5 business days." className="min-h-[80px] rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring" />
          </SectionCard>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <Button variant="outline" onClick={() => (onCancel ? onCancel() : onClose())} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </SlidePane>
    {dialog}
    </>);

}