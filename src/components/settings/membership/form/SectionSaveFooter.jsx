import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Right-aligned Cancel / Save Changes footer row shown inside a section card
 * whenever that section has unsaved changes.
 */
export default function SectionSaveFooter({ onCancel, onSave, saving }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button type="button" onClick={onSave} disabled={saving} className="gap-1.5">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}