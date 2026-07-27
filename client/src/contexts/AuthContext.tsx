import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../lib/axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER';
  avatar?: string;
  designation?: string;
  department?: { id: string; name: string };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // First hit refresh-token to see if we can get a memory access token
      const refreshResponse = await api.post('/auth/refresh-token');
      const { accessToken } = refreshResponse.data;
      setAccessToken(accessToken);

      // Fetch profile
      const profileResponse = await api.get('/auth/profile');
      setUser(profileResponse.data);
    } catch (error) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { accessToken, user: userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
    } catch (error) {
      setAccessToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
