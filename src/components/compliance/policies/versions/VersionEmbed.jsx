import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loaders';
import { policyFileUrl } from '@/lib/policyContent';

const isWord = (name) => /\.docx?$/i.test(name || '');

/** Embedded viewer for a version's file: PDFs render natively, Word files via the Office online viewer. */
export default function VersionEmbed({ version }) {
  const url = useQuery({
    queryKey: ['policyVersionUrl', version.id, version.file_uri], enabled: !!version.file_uri, staleTime: 5 * 60 * 1000,
    queryFn: () => policyFileUrl({ primary_file_uri: version.file_uri }),
  });
  if (!version.file_uri) return <p className="text-sm text-muted-foreground p-6">No document uploaded for this version.</p>;
  if (url.isLoading) return <div className="h-full flex items-center justify-center"><LoaderOne /></div>;
  if (url.isError) return <p className="text-sm text-destructive p-6">Couldn't load this document.</p>;
  const src = isWord(version.file_name) ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url.data)}` : url.data;
  return (
    <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground truncate flex-1">{version.display_title || version.file_name}</span>
        <a href={url.data} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </a>
      </div>
      <iframe title={version.display_title || 'Document'} src={src} className="flex-1 w-full bg-muted" />
    </div>
  );
}