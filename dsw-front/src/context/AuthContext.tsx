import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'faculty' | 'student';
  department?: string;
  designation?: string;
  employee_id?: string;
  roll_number?: string;
  course_branch?: string;
  year?: string;
  profile_photo_url?: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vc_token') || localStorage.getItem('dsw_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refetchUser = async () => {
    const storedToken = localStorage.getItem('vc_token') || localStorage.getItem('dsw_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const u = await apiRequest<User>('/auth/me');
      setUser(u);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('vc_token');
      localStorage.removeItem('vc_refresh_token');
      localStorage.removeItem('dsw_token');
      localStorage.removeItem('dsw_refresh_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = (newToken: string, newRefreshToken: string, newUser: User) => {
    localStorage.setItem('vc_token', newToken);
    localStorage.setItem('vc_refresh_token', newRefreshToken);
    localStorage.setItem('dsw_token', newToken);
    localStorage.setItem('dsw_refresh_token', newRefreshToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('vc_token');
    localStorage.removeItem('vc_refresh_token');
    localStorage.removeItem('dsw_token');
    localStorage.removeItem('dsw_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refetchUser }}>
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
