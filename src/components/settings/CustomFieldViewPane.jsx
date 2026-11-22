import React from 'react';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import { CustomFieldEdit } from '@/components/contacts/CustomFieldRenderer';
import { LOCKED_OBJECT_LABEL, LOCKED_SECTION_LABEL } from '@/lib/customFields';
import CloseButton from '@/components/shared/CloseButton';

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '–'}</p>
    </div>
  );
}

export default function CustomFieldViewPane({ isOpen, onClose, field }) {
  if (!field) return null;
  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full bg-background flex flex-col shadow-2xl">
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{field.name}</h2>
            <p className="text-sm text-muted-foreground">Field details (read only)</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="border border-border rounded-xl p-5 grid grid-cols-2 gap-4">
            <Row label="Field name" value={field.name} />
            <Row label="Field type" value={field.type} />
            <Row label="Object" value={LOCKED_OBJECT_LABEL} />
            <Row label="Section" value={LOCKED_SECTION_LABEL} />
            <div className="col-span-2">
              <Row label="Description" value={field.description} />
            </div>
          </div>

          <div className="border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-3">Preview</h3>
            <div className="max-w-xs pointer-events-none opacity-90">
              <CustomFieldEdit field={field} value={undefined} onChange={() => {}} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </SlidePane>
  );
}