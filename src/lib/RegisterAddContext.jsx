import React, { createContext, useContext, useState, useCallback } from 'react';

const RegisterAddContext = createContext(null);

/**
 * Bridges the "+ Add" button (rendered in the RegisterToolbar) with the
 * add actions that live inside RegisterGrid (which owns the data + API calls).
 * RegisterGrid registers its handlers; the toolbar dropdown invokes them.
 */
export function RegisterAddProvider({ children }) {
  const [handlers, setHandlers] = useState(null);

  const registerHandlers = useCallback((h) => setHandlers(h), []);

  return (
    <RegisterAddContext.Provider value={{ handlers, registerHandlers }}>
      {children}
    </RegisterAddContext.Provider>
  );
}

export function useRegisterAdd() {
  return useContext(RegisterAddContext);
}