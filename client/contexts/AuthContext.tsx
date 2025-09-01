// Path: client/contexts/AuthContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// ✅ PERBAIKAN: Gunakan js-cookie agar konsisten dengan halaman login
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import userApiClient from '@/lib/axiosUser';
// ✅ PERBAIKAN: Impor tipe User yang lengkap dari sumber utama
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

    useEffect(() => {
        // ✅ PERBAIKAN: Gunakan Cookies.get() untuk mengambil token
        const token = Cookies.get('token');
        
        console.log("Token yang dipakai:", token);
        if (token) {
            try {
                // Langsung decode token untuk mendapatkan data user awal
                const decodedUser: User = jwtDecode(token);
                setUser(decodedUser);
            } catch (error) {
                console.error("Token tidak valid atau kadaluarsa:", error);
                Cookies.remove('token'); // Hapus token yang tidak valid
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, userData: User) => {
        // ✅ PERBAIKAN: Gunakan Cookies.set() untuk menyimpan token
        Cookies.set('token', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
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
        // ✅ PERBAIKAN: Gunakan Cookies.remove() untuk menghapus token
        Cookies.remove('token');
        setUser(null);
        
        // Arahkan ke halaman login yang sesuai
        if (pathname.startsWith('/admin')) {
            router.push('/admin/login');
        } else if (pathname.startsWith('/dashboard/wali-kelas')) {
            router.push('/login/wali-kelas');
        }
        else {
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