// Path: client/app/admin/pengaturan/page.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast'; // ✅ TAMBAHAN: Impor toast

interface Settings {
    schoolName?: string;
    // Tambahkan pengaturan lain di sini di masa depan
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ PERBAIKAN: Gunakan path relatif untuk mengakses endpoint /api/settings
            // baseURL '/api/admin' + '../settings' -> '/api/settings'
            const response = await apiClient.get('/settings');
            setSettings(response.data);
        } catch (error) {
            toast.error("Gagal memuat pengaturan.");
            console.error("Gagal mengambil pengaturan:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('Menyimpan pengaturan...');
        try {
            // ✅ PERBAIKAN: Gunakan path relatif untuk mengakses endpoint /api/settings
            await apiClient.post('/settings', settings);
            toast.success('Pengaturan berhasil disimpan!', { id: toastId });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan.', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8">Memuat pengaturan...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Pengaturan Sistem</h1>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                <div className="space-y-6">
                    {/* Pengaturan Nama Sekolah */}
                    <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                            Nama Sekolah / Aplikasi
                        </label>
                        <input
                            type="text"
                            id="schoolName"
                            name="schoolName"
                            value={settings.schoolName || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">Nama ini akan ditampilkan di header dan judul halaman.</p>
                    </div>

                    {/* Tambahkan pengaturan lain di sini nanti */}

                </div>
                <div className="mt-8 pt-5 border-t">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary" // ✅ PERBAIKAN: Gunakan class konsisten
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </form>
        </div>
    );
}