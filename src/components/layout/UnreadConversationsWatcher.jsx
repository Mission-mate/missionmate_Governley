import { useEffect } from 'react';
import { useHasUnreadConversations } from '@/hooks/useUnreadConversations';

/**
 * Reports whether the signed-in user has unread conversations. Mounted only while the
 * Conversations module is enabled, so a disabled module loads and listens to nothing.
 */
export default function UnreadConversationsWatcher({ onChange }) {
  const hasUnread = useHasUnreadConversations();

  useEffect(() => {
    onChange(hasUnread);
  }, [hasUnread, onChange]);

  // The module was turned off: clear the indicator.
  useEffect(() => () => onChange(false), [onChange]);

  return null;
}