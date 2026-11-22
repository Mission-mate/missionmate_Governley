import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Bottom-right Cancel / Save Changes footer for inline-editable cards.
 * Rendered only while a card is in edit mode.
 */
export default function CardEditFooter({ onCancel, onSave, saving, saveDisabled = false }) {
  return (
    <div className="flex items-center justify-end gap-2 mt-6">
      <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button size="sm" onClick={onSave} disabled={saving || saveDisabled}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}