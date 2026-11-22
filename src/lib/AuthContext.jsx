import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { base44, supabase } from '@/api/base44Client';

const AuthContext = createContext();

/**
 * Sign-in state for the whole app, now backed by Supabase Auth.
 * Exposes the same values the Base44 version did, so the rest of the app is unchanged.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const lastUserId = useRef(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await base44.auth.me();
      lastUserId.current = currentUser.id;
      // Once per browser tab: record last_login and turn an invited member into an active one.
      const flag = `touch_login:${currentUser.id}`;
      if (!sessionStorage.getItem(flag)) {
        sessionStorage.setItem(flag, '1');
        supabase.rpc('touch_login').then(() => {}, () => {});
      }
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error?.code === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
      } else if (error?.status && error.status !== 401) {
        console.error('User auth check failed:', error);
        setAuthError({ type: 'unknown', message: error.message || 'Failed to load your account' });
      } else {
        setAuthError(null); // simply signed out — ProtectedRoute sends them to /login
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkAppState = checkUserAuth;

  useEffect(() => {
    checkUserAuth();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user?.id || null;
      // A different person signed in (e.g. in another tab). Re-load the user, outside the
      // auth callback as Supabase recommends. Token refreshes for the same user are ignored,
      // so open pages are never unmounted.
      if (event === 'SIGNED_IN' && id && lastUserId.current && id !== lastUserId.current) {
        lastUserId.current = id;
        setTimeout(() => checkUserAuth(), 0);
      }
      if (event === 'SIGNED_OUT') {
        lastUserId.current = null;
        setUser(null);
        setIsAuthenticated(false);
      }
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
        window.location.assign('/reset-password?recovery=1');
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, [checkUserAuth]);

  // Re-reads the signed-in user without the app-wide loading state, so the
  // current page stays mounted (e.g. after saving My Profile).
  const refreshUser = async () => {
    setUser(await base44.auth.me());
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout();
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        refreshUser,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
