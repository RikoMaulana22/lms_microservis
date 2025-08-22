// Path: src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import userApiClient from '@/lib/axiosUser';
import adminApiClient from '@/lib/axiosAdmin'; // <-- PERBAIKAN 1: Impor axiosAdmin
import { Settings, User } from '@/types';

// Tipe untuk data yang didekode dari token JWT
interface DecodedToken {
  userId: number;
  exp: number;
}

// Tipe untuk context, dengan penambahan baru
interface AuthContextType {
  user: User | null;
  token: string | null;
  settings: Settings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null; // State untuk pesan error
  login: (username: string, password: string) => Promise<boolean>; // Fungsi login yang melakukan API call
  logout: () => void;
  revalidateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mengatur header Authorization secara otomatis setiap kali token berubah
  useEffect(() => {
    const clients = [userApiClient, adminApiClient /*, dan client axios lainnya */];
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

  // Fungsi untuk memvalidasi ulang data pengguna dari server
  const revalidateUser = useCallback(async () => {
    try {
      // <-- PERBAIKAN 2: Endpoint diperbaiki dari /auth/me menjadi /me
      const response = await userApiClient.get(`/me`);
      const freshUserData = response.data;
      setUser(freshUserData);
      localStorage.setItem('user', JSON.stringify(freshUserData));
    } catch (error) {
      console.error("Gagal memvalidasi ulang sesi, logout...", error);
      logout(); // Jika gagal (misal token dicabut), logout paksa
    }
  }, [logout]);

  // Inisialisasi aplikasi saat pertama kali dimuat
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Ambil pengaturan sistem dari admin-service
      try {
        // <-- PERBAIKAN 3: Menggunakan adminApiClient dan path yang benar
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

  // <-- PERBAIKAN 4: Fungsi login yang lengkap dengan pemanggilan API
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userApiClient.post('/login', { username, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      return true; // Login berhasil
    } catch (err: any) {
      console.error("Login gagal:", err);
      setError(err.response?.data?.message || 'Username atau password salah.');
      return false; // Login gagal
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{
      user,
      token,
      settings,
      isLoading,
      isAuthenticated: !!user,
      error,
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