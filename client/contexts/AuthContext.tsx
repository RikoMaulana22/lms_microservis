// Path: src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import userApiClient from '@/lib/axiosUser';
import adminApiClient from '@/lib/axiosAdmin';
import { Settings, User } from '@/types';

interface DecodedToken {
  userId: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  settings: Settings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void; // Dikembalikan seperti semula
  logout: () => void;
  revalidateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efek ini akan berjalan setiap kali token berubah untuk mengatur header default
  useEffect(() => {
    const clients = [userApiClient, adminApiClient]; // Tambahkan semua axios client lain di sini
    clients.forEach(client => {
        if (token) {
            client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete client.defaults.headers.common['Authorization'];
        }
    });
  }, [token]);
  
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const revalidateUser = useCallback(async () => {
    try {
      const response = await userApiClient.get(`/me`);
      const freshUserData = response.data;
      setUser(freshUserData);
      localStorage.setItem('user', JSON.stringify(freshUserData));
    } catch (error) {
      console.error("Gagal memvalidasi ulang sesi, logout...", error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      try {
        const settingsResponse = await adminApiClient.get('/settings');
        setSettings(settingsResponse.data);
      } catch (error) {
        console.error("Gagal mengambil pengaturan sistem:", error);
      }

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decodedToken: DecodedToken = jwtDecode(storedToken);
          if (decodedToken.exp * 1000 > Date.now()) {
            setToken(storedToken);
            await revalidateUser();
          } else {
            logout();
          }
        } catch (error) {
          console.error("Token tidak valid:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeApp();
  }, [revalidateUser, logout]);

  // PERBAIKAN: Fungsi login dikembalikan untuk hanya menyimpan state
  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      settings,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      revalidateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};