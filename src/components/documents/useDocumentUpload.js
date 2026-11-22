import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { uploadDocumentFile } from '@/lib/documentStorage';

/**
 * File state and save flow shared by every add-document form: stores the file
 * privately, then creates the document record. A failure keeps the form open
 * with an error and always releases the saving state.
 */
export default function useDocumentUpload({ isOpen, entity = 'Document', onSaved, onClose }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) { setFile(null); setSaving(false); setError(null); }
  }, [isOpen]);

  const save = async (record) => {
    if (!file || saving) return;
    setSaving(true);
    setError(null);
    try {
      const fileData = await uploadDocumentFile(file);
      await base44.entities[entity].create({ ...record, ...fileData });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'The document could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return { file, setFile, saving, error, save };
}