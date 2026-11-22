import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SettingsCard from '@/components/settings/profile/SettingsCard';
import { base44 } from '@/api/base44Client';

export default function OrgLogoCard({ value, orgName, onChange, cardProps }) {
  const [uploading, setUploading] = useState(false);
  const editing = cardProps.editing;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <SettingsCard title="Organisation Logo" subtitle="Upload your organisation's logo." {...cardProps} saveDisabled={cardProps.saveDisabled || uploading}>
      <div>
        {editing && (
          <p className="text-xs text-muted-foreground mb-3">The proposed size is 350px × 180px. No bigger than 2.5 MB</p>
        )}
        <div className="mb-3 w-[350px] max-w-full">
          {value ? (
            <img src={value} alt="Organisation logo" className="block rounded-lg object-contain max-w-full max-h-[180px]" />
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20 w-[350px] max-w-full h-[180px]">
              <span className="text-5xl font-bold text-muted-foreground">{(orgName || 'O').charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        {editing && (
          <div className="flex gap-2">
            <label htmlFor="logo-upload" className="cursor-pointer">
              <Button size="sm" variant="outline" className="text-xs h-8 pointer-events-none" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
            </label>
            {value && (
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onChange('')}>Remove</Button>
            )}
          </div>
        )}
      </div>
    </SettingsCard>
  );
}