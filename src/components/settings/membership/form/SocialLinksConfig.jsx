import React from 'react';
import { Facebook, Instagram, Linkedin, Globe, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/your-organisation' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/your-organisation' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/your-organisation' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://your-organisation.com' },
];

/**
 * Social links editor. Shows a logo per platform; clicking a logo adds it and
 * reveals a URL input. Only added platforms are stored on the form config.
 */
export default function SocialLinksConfig({ value = {}, onChange }) {
  const links = value || {};

  const isAdded = (key) => links[key] !== undefined && links[key] !== null;

  const addSocial = (key) => {
    onChange({ ...links, [key]: '' });
  };

  const removeSocial = (key) => {
    const next = { ...links };
    delete next[key];
    onChange(next);
  };

  const updateUrl = (key, url) => {
    onChange({ ...links, [key]: url });
  };

  return (
    <div>
      <Label className="mb-1.5 block text-sm">Social Links</Label>
      <p className="text-xs text-muted-foreground mb-3">Add the social platforms your organisation uses. Click a logo to add it, then paste the link.</p>

      {/* Logo picker */}
      <div className="flex items-center gap-2 mb-3">
        {SOCIALS.map(({ key, label, icon: Icon }) => {
          const added = isAdded(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => (added ? removeSocial(key) : addSocial(key))}
              title={added ? `Remove ${label}` : `Add ${label}`}
              className={cn(
                'relative w-10 h-10 rounded-lg border flex items-center justify-center transition-colors',
                added
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="w-5 h-5" />
              <span
                className={cn(
                  'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white',
                  added ? 'bg-destructive' : 'bg-primary'
                )}
              >
                {added ? <X className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* URL inputs for added platforms */}
      <div className="space-y-3">
        {SOCIALS.filter(({ key }) => isAdded(key)).map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <Label className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5" /> {label}
            </Label>
            <Input
              value={links[key] || ''}
              onChange={(e) => updateUrl(key, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}