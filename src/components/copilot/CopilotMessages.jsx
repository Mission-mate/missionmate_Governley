import React, { useEffect, useRef } from 'react';
import { fileSize } from '@/lib/conversations';
import FileTypeIcon from '@/components/documents/FileTypeIcon';

/** The messages sent in this session, each with its attached files, newest at the bottom and kept in view. */
export default function CopilotMessages({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-7 py-4">
      {messages.map((message) => (
        <div key={message.id} className="ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
          {message.text && (
            <div className="w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
              {message.text}
            </div>
          )}
          {message.attachments.map((file) => (
            <div
              key={file.file_url}
              className="flex max-w-full items-center gap-2.5 rounded-[9px] border border-border bg-card px-2.5 py-2 text-left"
            >
              <FileTypeIcon fileName={file.file_name} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[13px] font-semibold text-foreground">{file.file_name}</span>
                <span className="text-[11px] text-muted-foreground">{fileSize(file.file_size)}</span>
              </span>
            </div>
          ))}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}