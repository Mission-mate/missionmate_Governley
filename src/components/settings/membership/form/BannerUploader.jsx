import React, { useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Uploads a banner image for the public membership form via the Core integration.
export default function BannerUploader({ value, onChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload the banner image.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border group">
        <img src={value} alt="Form banner" className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <label>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button type="button" variant="secondary" size="sm" className="gap-1.5 pointer-events-none">
              <ImagePlus className="w-3.5 h-3.5" /> Replace
            </Button>
          </label>
          <Button type="button" variant="destructive" size="sm" className="gap-1.5" onClick={() => onChange('')}>
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      {uploading ? (
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Add a banner image</p>
          <p className="text-xs text-muted-foreground">Shown at the top of your membership form</p>
        </>
      )}
    </label>
  );
}