import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('snack_token');
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('snack_token');
    if (storedToken) {
      setToken(storedToken);
      authApi.me()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('snack_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
