import React, { useState, useEffect, useMemo } from 'react';
import { Copy, ExternalLink, Share2, Code2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SectionCard from '@/components/shared/SectionCard';

const CONFIG_KEY = 'membership_form_domain';

// Normalise a user/auto value into a clean origin (https://host, no trailing slash/path).
const cleanOrigin = (raw) => {
  if (!raw) return '';
  let v = raw.trim().replace(/\/+$/, '');
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    return new URL(v).origin;
  } catch {
    return '';
  }
};

/**
 * Center modal for sharing the public membership form. Provides a shareable URL
 * and an iframe embed snippet so the form can be displayed on an external website.
 */
export default function ShareFormModal({ isOpen = true, onClose }) {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);

  const detectedOrigin = useMemo(
    () => (typeof window !== 'undefined' ? cleanOrigin(window.location.origin) : ''),
    []
  );

  useEffect(() => {
    (async () => {
      const recs = await base44.entities.AppConfig.filter({ key: CONFIG_KEY });
      setDomain(cleanOrigin(recs[0]?.settings?.domain) || detectedOrigin);
      setLoading(false);
    })();
  }, [detectedOrigin]);

  const publicUrl = `${domain || detectedOrigin}/join`;
  const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="800" frameborder="0" style="border:0;" title="Membership Application"></iframe>`;

  const copy = (value, label) => {
    navigator.clipboard?.writeText(value);
    toast({ title: `${label} copied` });
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <div className="bg-card rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Share2 className="w-5 h-5 text-primary" />
              Share Membership Page
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Share your membership page as a link or embed it on your website.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-4">
          {/* Public Form URL */}
          <SectionCard>
            <Label className="text-sm font-semibold text-foreground mb-1.5 block">Public Page URL</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={loading ? 'Loading…' : publicUrl} className="font-mono text-xs bg-card" />
              <Button type="button" variant="outline" size="sm" onClick={() => copy(publicUrl, 'Public URL')} className="gap-1.5 shrink-0 bg-card">
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 bg-card shrink-0" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
              </Button>
            </div>
          </SectionCard>

          {/* Iframe embed */}
          <SectionCard>
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <Code2 className="w-4 h-4" /> Iframe Embed
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Iframe allows you to display the membership page directly on your own website.
            </p>
            <Textarea readOnly value={iframeSnippet} rows={3} className="font-mono text-xs resize-none bg-card" />
            <Button type="button" variant="outline" size="sm" onClick={() => copy(iframeSnippet, 'Embed code')} className="gap-1.5 mt-2 bg-card">
              <Copy className="w-3.5 h-3.5" /> Copy Embed Code
            </Button>
          </SectionCard>
        </div>
      </div>
    </ModalOverlay>
  );
}