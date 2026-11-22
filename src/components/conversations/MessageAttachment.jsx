import React from 'react';
import { fileSize } from '@/lib/conversations';
import FileTypeIcon from '@/components/documents/FileTypeIcon';
import IconTip from '@/components/shared/IconTip';
import HighlightText from './search/HighlightText';

/**
 * A message's file, shown as its own white outlined card beside the message bubble, with the file-type tile used in Document Files.
 * Hover deepens the outline and shadow and lifts the tile.
 * `data-own-tip` keeps the message's time hint from showing over the card's own "Open file" tip.
 */
export default function MessageAttachment({ message, onOpen, searchTerm }) {
  return (
    <IconTip label="Open file">
      <button
        type="button"
        data-own-tip=""
        onClick={() => onOpen(message)}
        aria-label={`Open ${message.attachment_name}`}
        className={`group box-border flex items-center gap-[11px] w-full px-2.5 py-[9px] rounded-[9px] border border-slate-200 dark:border-border bg-white dark:bg-card text-left cursor-pointer shadow-[0_2px_5px_rgba(39,54,75,0.07)] transition-[background-color,border-color,box-shadow] duration-200 ease-[ease] hover:border-slate-300 hover:bg-[#fcfdff] hover:shadow-[0_4px_10px_rgba(39,54,75,0.11)] active:shadow-[0_1px_3px_rgba(39,54,75,0.12)] dark:hover:border-muted-foreground/40 dark:hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400`}
      >
        <span className="flex shrink-0 drop-shadow-[0_1px_1px_rgba(15,23,42,0.08)] transition-[transform,filter] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_4px_6px_rgba(15,23,42,0.18)]">
          <FileTypeIcon fileName={message.attachment_name} />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
          <span className="block truncate text-[13px] font-[650] leading-[1.35] text-slate-700 dark:text-foreground transition-colors duration-200 ease-[ease] group-hover:text-primary dark:group-hover:text-primary">
            <HighlightText text={message.attachment_name} term={searchTerm} />
          </span>
          <span className="text-[11px] leading-[1.35] text-slate-500 dark:text-muted-foreground">{fileSize(message.attachment_size)}</span>
        </span>
      </button>
    </IconTip>
  );
}