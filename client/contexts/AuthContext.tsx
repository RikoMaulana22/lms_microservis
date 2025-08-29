// Path: client/contexts/AuthContext.tsx

"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import userApiClient from '@/lib/axiosUser'; // Pastikan Anda punya axios instance untuk user service

interface User {
  id: number;
  fullName: string;
  role: 'admin' | 'guru' | 'siswa' | 'wali_kelas';
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const revalidateUser = async (token: string) => {
    try {
      // =================================================================
      // PERBAIKAN UTAMA DI SINI: URL diubah dari /api/users/profile menjadi /users/profile
      // Axios instance sudah memiliki base URL http://localhost:5001/api
      // =================================================================
      const response = await userApiClient.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Gagal memvalidasi sesi, token tidak valid.', error);
      logout(); // Jika validasi gagal, logout pengguna
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      revalidateUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    if (userData.role === 'admin') {
      router.push('/admin/users');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (pathname.startsWith('/admin')) {
        router.push('/admin/login');
    } else {
        router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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