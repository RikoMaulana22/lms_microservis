// Path: app/(auth)/register/page.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/axiosAdmin';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    // --- PERUBAHAN 1: Tambahkan 'wali_kelas' ke dalam tipe data role ---
    const [role, setRole] = useState<'siswa' | 'guru' | 'wali_kelas'>('siswa');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            username,
            email,
            password,
            fullName,
            role,
        };

        const toastId = toast.loading('Mendaftarkan akun...');

        try {
            const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL_USER}/auth/register`, payload);
            toast.success(response.data.message || 'Registrasi berhasil!', { id: toastId });

            // --- PERUBAHAN 2: Logika redirect berdasarkan peran ---
            if (role === 'wali_kelas') {
                // Jika wali kelas, arahkan untuk login ke halaman wali kelas
                toast('Silakan login melalui halaman Wali Kelas.', { icon: 'ℹ️' });
                router.push('/login/wali-kelas');
            } else {
                // Jika siswa atau guru, arahkan ke halaman login biasa
                router.push('/login');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registrasi gagal, periksa kembali data Anda.', { id: toastId });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-800">Buat Akun Baru</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (input fields lain tidak berubah) ... */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Daftar sebagai</label>
                        {/* --- PERUBAHAN 3: Tambahkan opsi Wali Kelas di dropdown --- */}
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'siswa' | 'guru' | 'wali_kelas')}
                            className="mt-1 block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="siswa">Siswa</option>
                            <option value="guru">Guru</option>
                            <option value="wali_kelas">Wali Kelas</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                        {isLoading ? 'Mendaftarkan...' : 'Daftar'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    Sudah punya akun? <Link href="/login" className="font-medium text-blue-600 hover:underline">Masuk di sini</Link>
                </p>
            </div>
        </div>
    );
}