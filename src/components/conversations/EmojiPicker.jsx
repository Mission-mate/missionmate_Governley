import React from 'react';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJIS = [
  '😀', '😄', '😁', '😂', '🤣', '😊', '🙂', '😉',
  '😍', '🥰', '😘', '😎', '🤩', '🤔', '🤗', '😅',
  '😢', '😭', '😮', '😴', '😬', '🙄', '😇', '🥳',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '👋', '🤝',
  '❤️', '💙', '💚', '🎉', '✨', '🔥', '⭐', '💡',
  '✅', '❌', '⚠️', '📌', '📎', '📅', '☕', '🚀',
];

export default function EmojiPicker({ onPick, triggerClassName }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Emoji" className={triggerClassName}>
          <Smile className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className="sr-only">Emoji</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-[296px] p-2 rounded-xl">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onPick(emoji)}
              className="h-8 w-8 rounded-lg text-lg leading-none flex items-center justify-center hover:bg-muted hover:scale-110 transition-[background-color,transform] duration-150"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}