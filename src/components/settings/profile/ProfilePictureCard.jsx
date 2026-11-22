import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IllustratedAvatar, { avatarOptions } from '@/components/settings/IllustratedAvatar';
import SettingsCard from '@/components/settings/profile/SettingsCard';
import { base44 } from '@/api/base44Client';
import { optimiseAvatar } from '@/lib/imageOptimise';
import { cn } from '@/lib/utils';

export default function ProfilePictureCard({ value, onChange, initials, cardProps }) {
  const [uploading, setUploading] = useState(false);
  const editing = cardProps.editing;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Shrink + convert to WebP before upload so the avatar stays a few KB.
      const optimised = await optimiseAvatar(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: optimised });
      onChange(file_url);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <SettingsCard title="Profile Picture" subtitle="Upload your own photo or pick one of our avatars." {...cardProps} saveDisabled={cardProps.saveDisabled || uploading}>
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 shrink-0 overflow-hidden rounded-full bg-primary/10 text-primary flex items-center justify-center">
          {value ? <IllustratedAvatar value={value} /> : <span className="text-xl">{initials}</span>}
        </div>
        {editing && (
          <div className="flex gap-2">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Button size="sm" variant="outline" className="text-xs h-8 pointer-events-none" disabled={uploading}>
                {uploading ? 'Optimising...' : 'Upload'}
              </Button>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
            </label>
            {value && (
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onChange('')}>Remove</Button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Select an avatar</p>
          <div className="grid grid-cols-4 gap-3 w-fit">
            {avatarOptions.map((option) => {
              const selected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={cn(
                    'relative shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 transition-colors bg-muted',
                    selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  )}
                >
                  <IllustratedAvatar value={option.value} priority={false} />
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-primary/30">
                      <Check className="w-5 h-5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </SettingsCard>
  );
}