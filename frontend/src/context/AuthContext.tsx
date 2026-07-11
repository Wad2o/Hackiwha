import { createContext, useContext, useState, type ReactNode } from 'react';
import * as storage from '../lib/storage';

interface AuthContextValue {
  token: string | null;
  authUserId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, authUserId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(storage.getAuthToken());
  const [authUserId, setAuthUserIdState] = useState<string | null>(storage.getAuthUserId());

  function setAuth(newToken: string, newAuthUserId: string) {
    storage.setAuthToken(newToken);
    storage.setAuthUserId(newAuthUserId);
    setToken(newToken);
    setAuthUserIdState(newAuthUserId);
  }

  function logout() {
    storage.clearAuth();
    setToken(null);
    setAuthUserIdState(null);
  }

  return (
    <AuthContext.Provider value={{ token, authUserId, isAuthenticated: !!token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
