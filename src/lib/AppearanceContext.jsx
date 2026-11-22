import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const AppearanceContext = createContext(null);

const STORAGE_KEY = 'mm_theme';

/** Only light/dark are supported — any legacy value (e.g. 'system') resolves to light. */
const normalise = (value) => (value === 'dark' ? 'dark' : 'light');

export function AppearanceProvider({ children }) {
  const { user } = useAuth();
  // localStorage is a fast initial-paint cache only; the user profile is the source of truth.
  const [theme, setThemeState] = useState(() => normalise(localStorage.getItem(STORAGE_KEY)));

  // Apply the theme to the document and refresh the paint cache.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Sync from the logged-in user's saved preference once auth resolves.
  useEffect(() => {
    if (!user) return;
    const saved = user.theme || user.data?.theme;
    if (saved) setThemeState(normalise(saved));
  }, [user]);

  const setTheme = useCallback(async (next) => {
    const resolved = normalise(next);
    setThemeState(resolved);
    await base44.auth.updateMe({ theme: resolved });
  }, []);

  return (
    <AppearanceContext.Provider value={{ theme, setTheme }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}