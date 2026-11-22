import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { fieldIsMulti } from '@/lib/customFields';
import { Upload, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import MultiSelectDropdown from '@/components/contacts/MultiSelectDropdown';

/* ── Read-only display ─────────────────────────────────────────────────────── */
export function CustomFieldView({ field, value }) {
  const options = field.options || [];
  const labelFor = (v) => options.find((o) => o.value === v)?.label || v;

  let display;
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    display = <p className="text-sm font-medium text-foreground">–</p>;
  } else if (field.type === 'File Upload' && typeof value === 'object') {
    display = (
      <a href={value.file_url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <FileText className="w-3.5 h-3.5" /> {value.file_name || 'View file'}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  } else if (field.type === 'Date' || field.type === 'Date Picker') {
    display = <p className="text-sm font-medium text-foreground">{(() => { try { return format(new Date(value), 'd MMM yyyy'); } catch { return value; } })()}</p>;
  } else if (Array.isArray(value)) {
    display = (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {value.map((v) => (
          <span key={v} className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">{labelFor(v)}</span>
        ))}
      </div>
    );
  } else {
    display = <p className="text-sm font-medium text-foreground">{field.options?.length ? labelFor(value) : value}</p>;
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{field.name}</p>
      {display}
    </div>
  );
}

/* ── File upload control ───────────────────────────────────────────────────── */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Blocked audio/video extensions for custom field uploads.
const BLOCKED_EXTENSIONS = ['mp3', 'wav', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'wmv', 'ogv', '3gp', '3g2'];

function FileUploadControl({ value, onChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      toast({ title: 'File format is not supported', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'Max file size allowed is up to 50MB per file', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ file_url, file_name: file.name, file_size: file.size });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (value?.file_url) {
    return (
      <div className="flex items-center gap-2">
        <a href={value.file_url} target="_blank" rel="noopener noreferrer"
          className="flex-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline truncate">
          <FileText className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{value.file_name}</span>
        </a>
        <button onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center justify-center gap-2 h-9 px-3 text-sm border border-dashed border-input rounded-md cursor-pointer hover:border-primary/50 transition-colors text-muted-foreground">
      <Upload className="w-3.5 h-3.5" />
      {uploading ? 'Uploading...' : 'Upload Document'}
      <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  );
}

/* ── Editable control ──────────────────────────────────────────────────────── */
export function CustomFieldEdit({ field, value, onChange }) {
  const options = field.options || [];

  switch (field.type) {
    case 'Number':
      return <Input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" placeholder="Enter a number" />;
    case 'Phone':
      return <Input type="tel" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" placeholder="Enter a phone number" />;
    case 'Date':
    case 'Date Picker':
      return <DateField value={value || ''} onChange={onChange} />;
    case 'Long Text':
      return <Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="text-sm min-h-[80px] resize-y" placeholder="Enter text" />;
    case 'File Upload':
      return <FileUploadControl value={value} onChange={onChange} />;
    case 'Dropdown (Single Select)':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select an option" /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case 'Radio Button':
    case 'Radio Buttons':
      return (
        <div className="space-y-1.5">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">{o.label}</span>
            </label>
          ))}
        </div>
      );
    case 'Dropdown (Multi-Select)':
      return <MultiSelectDropdown options={options} value={value} onChange={onChange} placeholder="Select options" />;
    case 'Checkbox': {
      const arr = Array.isArray(value) ? value : [];
      const toggle = (v) => onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
      return (
        <div className="space-y-1.5">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={arr.includes(o.value)} onChange={() => toggle(o.value)} className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm text-foreground">{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    case 'Text':
    default:
      return <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" placeholder="Enter text" />;
  }
}

/** Coerce a stored value to a sensible default based on the field type. */
export function defaultValueForField(field) {
  return fieldIsMulti(field.type) ? [] : '';
}