import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocal: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.warn('Stored session invalid or expired:', err);
          clearStoredToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const res = await api.login(username, password);
    setStoredToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearStoredToken();
    setTokenState(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch {
      logout();
    }
  };

  const updateUserLocal = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        updateUserLocal,
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
