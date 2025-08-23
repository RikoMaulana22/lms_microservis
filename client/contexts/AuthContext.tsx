// Path: client/src/contexts/AuthContext.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Settings, User } from '@/types';

// --- 1. IMPOR SEMUA CLIENT API YANG ADA ---
import userApiClient from '@/lib/axiosUser';
import adminApiClient from '@/lib/axiosAdmin';
import classContentApiClient from '@/lib/axiosClassContent';
import announcementApiClient from '@/lib/axiosAnnouncement';
import scheduleApiClient from '@/lib/axiosSchedule';
import attendanceApiClient from '@/lib/axiosAttendance';
import assignmentApiClient from '@/lib/axiosAssignment';
import homeroomApiClient from '@/lib/axiosHomeroom';

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
  login: (token: string, userData: User) => void;
  logout: () => void;
  revalidateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Efek untuk mengatur header default pada semua instance axios
  useEffect(() => {
    // --- 2. PASTIKAN SEMUA CLIENT TERDAFTAR DI SINI ---
    const clients = [
      userApiClient,
      adminApiClient,
      classContentApiClient,
      announcementApiClient,
      scheduleApiClient,
      attendanceApiClient,
      assignmentApiClient,
      homeroomApiClient
    ];
    
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
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
        logout();
        return;
    }
    try {
      const response = await userApiClient.get(`/auth/me`);
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

      if (token) {
        try {
          const decodedToken: DecodedToken = jwtDecode(token);
          if (decodedToken.exp * 1000 > Date.now()) {
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
  }, [token, revalidateUser, logout]);

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