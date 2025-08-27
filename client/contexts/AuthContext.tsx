'use client';

import { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import userApiClient from '@/lib/axiosUser';
import { User } from '@/types';

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

  const logout = useCallback(() => {
    setUser(null);
    Cookies.remove('token');
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      router.push('/login');
    }
  }, [router, pathname]);

  useEffect(() => {
    const revalidateUser = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const response = await userApiClient.get('/auth/profile');
          setUser(response.data);
        } catch (error) {
          console.error('Gagal memvalidasi sesi, token tidak valid.', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    revalidateUser();
  }, [logout]);

  const login = (token: string, userData: User) => {
    setUser(userData);
    Cookies.set('token', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
    
    switch (userData.role) {
      case 'admin':
        router.push('/admin/kelas');
        break;
      case 'wali_kelas':
        router.push('/dashboard/wali-kelas');
        break;
      case 'guru':
      case 'siswa':
      default:
        router.push('/dashboard');
        break;
    }
  };
  
  const value = { user, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
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