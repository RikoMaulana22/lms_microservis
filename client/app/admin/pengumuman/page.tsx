// Path: client/app/admin/pengumuman/page.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
// ✅ BENAR: API client ini sudah benar
import announcementApiClient from '@/lib/axiosAnnouncement';
import toast from 'react-hot-toast'; // ✅ TAMBAHAN: Impor toast
import { FaTrash } from 'react-icons/fa';

interface Announcement {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    author: { // Asumsikan ada relasi author
        fullName: string;
    }
}

export default function ManageAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk form
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ PERBAIKAN: Endpoint untuk GET semua pengumuman adalah '/'
            // baseURL '/api/announcements' + '/' -> '/api/announcements'
            const response = await announcementApiClient.get(`/`);
            setAnnouncements(response.data);
        } catch (error) {
            toast.error("Gagal memuat data pengumuman.");
            console.error("Gagal mengambil data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading('Mengirim pengumuman...');
        try {
            // ✅ PERBAIKAN: Endpoint untuk POST pengumuman adalah '/'
            await announcementApiClient.post('/', { title, content });
            toast.success('Pengumuman berhasil dibuat!', { id: toastId });
            setTitle('');
            setContent('');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal membuat pengumuman.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Yakin ingin menghapus pengumuman ini?')) {
            const toastId = toast.loading('Menghapus pengumuman...');
            try {
                // ✅ PERBAIKAN: Endpoint untuk DELETE adalah '/:id'
                await announcementApiClient.delete(`/${id}`);
                toast.success('Pengumuman berhasil dihapus.', { id: toastId });
                fetchData();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Gagal menghapus pengumuman.', { id: toastId });
            }
        }
    };

    return (
        <div className="container mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-gray-800">
            {/* Kolom Kiri: Form Buat Pengumuman */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Buat Pengumuman Baru</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium border-gray-500">Judul</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-input px-4 py-3 w-full mt-1 border border-gray-600 text-gray-700 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium border-gray-500">Isi Pengumuman</label>
                            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className="form-textarea px-4 py-3 w-full mt-1 border border-gray-600 text-gray-700 rounded-md"></textarea>
                        </div>
                        <div className="text-right">
                            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                                {isSubmitting ? 'Mengirim...' : 'Kirim Pengumuman'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Kolom Kanan: Daftar Pengumuman */}
            <div className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Pengumuman</h2>
                <div className="space-y-4">
                    {isLoading ? <p>Memuat...</p> : announcements.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('id-ID')}</p>
                                    <p className="mt-2 text-gray-700">{item.content}</p>
                                </div>
                                <button onClick={() => handleDelete(Number(item.id))} className="text-gray-400 hover:text-red-600 ml-4"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}