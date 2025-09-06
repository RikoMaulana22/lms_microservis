// Path: client/contexts/AuthContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import apiClient from '@/lib/axios'; // Menggunakan apiClient utama

// Definisikan tipe User yang lebih spesifik
export interface User {
    id: number | string;
    fullName: string;
    email: string;
    role: 'admin' | 'wali_kelas' | 'guru' | 'siswa';
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
    const [isLoading, setIsLoading] = useState(true); // Mulai dengan loading
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const validateToken = async () => {
            const token = Cookies.get('token');
            
            if (token) {
                try {
                    // --- PERBAIKAN UTAMA ---
                    // Validasi token ke server untuk mendapatkan data user yang fresh
                    const response = await apiClient.get('/auth/me', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setUser(response.data);
                } catch (error) {
                    console.error("Gagal memvalidasi token:", error);
                    // Hapus token yang tidak valid jika ada error
                    Cookies.remove('token');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        validateToken();
    }, []);

    const login = (token: string, userData: User) => {
        // Simpan token di cookies
        Cookies.set('token', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
        // Set data user di state
        setUser(userData);

        // Arahkan pengguna berdasarkan peran
        if (userData.role === 'admin') {
            router.push('/admin/pengguna');
        } else if (userData.role === 'wali_kelas') {
            router.push('/dashboard/wali-kelas');
        } else {
            router.push('/dashboard');
        }
    };

    const logout = () => {
        Cookies.remove('token');
        setUser(null);
        
        // Arahkan ke halaman login yang sesuai
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