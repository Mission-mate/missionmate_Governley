import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useConversationList, useReadState, useConversationEvents } from '@/hooks/useConversations';

/** True while any of the signed-in user's conversations has unread messages. Shares the Conversations page's data. */
export function useHasUnreadConversations() {
  const meId = useAuth().user.id;
  // The Conversations page keeps the shared list and read state current itself while it is open.
  const onPage = useLocation().pathname === '/conversations';
  const list = useConversationList(meId);
  const reads = useReadState(meId, list.conversations);

  useConversationEvents((event) => {
    if (onPage) return;
    if (event.type === 'delete') list.remove(event.id);
    else list.put({ ...event.data, id: event.id });
    reads.sync();
  });

  return Object.values(reads.readState).some((state) => state.unread > 0);
}