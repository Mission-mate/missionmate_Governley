import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const RegisterSaveContext = createContext(null);

/**
 * Provides global autosave status for a RegisterDetail page.
 * useAutoSaveCell calls notifySaving() / notifySaved() to drive the indicator.
 */
export function RegisterSaveProvider({ children }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const pendingRef = useRef(0);
  const idleTimer = useRef(null);

  const notifySaving = useCallback(() => {
    pendingRef.current += 1;
    clearTimeout(idleTimer.current);
    setStatus('saving');
  }, []);

  const notifySaved = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (pendingRef.current === 0) {
      setStatus('saved');
      idleTimer.current = setTimeout(() => setStatus('idle'), 2500);
    }
  }, []);

  return (
    <RegisterSaveContext.Provider value={{ status, notifySaving, notifySaved }}>
      {children}
    </RegisterSaveContext.Provider>
  );
}

export function useRegisterSave() {
  return useContext(RegisterSaveContext);
}