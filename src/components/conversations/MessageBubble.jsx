import React from 'react';
import { motion } from 'framer-motion';
import { messageTime, isFresh } from '@/lib/conversations';
import MessageAttachment from './MessageAttachment';
import { cn } from '@/lib/utils';
import HighlightText from './search/HighlightText';
import BubbleTail from './BubbleTail';

/**
 * One chat message. `senderName` and `showTime` add the line above the bubble that opens a run of messages;
 * `tail` marks the bubble that ends a run.
 */
export default function MessageBubble({ message, mine, senderName, showTime, tail, actions, onOpenAttachment, searchTerm }) {
  const fresh = isFresh(message.sent_at);
  const time = messageTime(message.sent_at);
  const withText = Boolean(message.text);
  return (
    <motion.div
      initial={fresh ? { opacity: 0, y: 10, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}
    >
      {(senderName || showTime) && (
        <p className="flex items-baseline gap-2 px-1 mb-1">
          {senderName && <span className="text-[13px] font-semibold text-foreground">{senderName}</span>}
          {showTime && <span className="text-xs font-medium text-muted-foreground tabular-nums">{time}</span>}
        </p>
      )}
      <div className={cn('w-full flex items-center gap-1.5', mine && 'flex-row-reverse')}>
        {/* The text bubble and the file card sit stacked; a file-only message shows just its card. */}
        {/* A message with a file takes the poll card's width, so file cards and polls line up. */}
        <div
          title={time}
          className={cn(
            'min-w-0 flex flex-col gap-1.5',
            message.attachment_name ? 'flex-1 max-w-sm' : 'max-w-[82%] sm:max-w-[65%]',
            mine ? 'items-end' : 'items-start'
          )}
        >
          {withText && (
            <div
              className={cn(
                'relative max-w-full rounded-2xl px-3.5 py-2',
                mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                mine ? (tail ? 'rounded-br-none' : 'rounded-br-md') : (tail ? 'rounded-bl-none' : 'rounded-bl-md')
              )}
            >
              {tail && <BubbleTail mine={mine} />}
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words"><HighlightText text={message.text} term={searchTerm} /></p>
            </div>
          )}
          {message.attachment_name && (
            <MessageAttachment message={message} onOpen={onOpenAttachment} searchTerm={searchTerm} />
          )}
        </div>
        {actions}
      </div>
    </motion.div>
  );
}