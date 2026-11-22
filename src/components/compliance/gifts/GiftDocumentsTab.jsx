import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import DocumentsTab from '@/components/documents/DocumentsTab';
import { GIFT_OBJECT_TYPE } from '@/lib/giftRegister';

/** Documents attached to a single gift or benefit record. */
export default function GiftDocumentsTab({ gift, readOnly }) {
  const { user } = useAuth();
  return <DocumentsTab objectType={GIFT_OBJECT_TYPE} objectId={gift.id} currentUser={user} hideTitle readOnly={readOnly} compact />;
}