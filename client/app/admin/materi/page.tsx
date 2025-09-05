// Path: client/app/admin/materi/page.tsx
'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
// ✅ PERBAIKAN: Ganti adminApiClient dengan classContentApiClient
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast'; // ✅ TAMBAHAN: Impor toast
import { FaFilePdf, FaTrash } from 'react-icons/fa';

interface GlobalMaterial {
    id: number;
    title: string;
    fileUrl: string;
    createdAt: string;
}

export default function ManageGlobalMaterialsPage() {
    const [materials, setMaterials] = useState<GlobalMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State untuk form upload
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ PERBAIKAN: Gunakan client yang benar dan sesuaikan endpoint
            // baseURL '/api/classes' + '../materials/global' -> '/api/materials/global'
            const response = await apiClient.get(`../materials/global`);
            setMaterials(response.data);
        } catch (error) {
            toast.error("Gagal memuat materi global.");
            console.error("Gagal mengambil materi global:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || !title) {
            toast.error('Judul dan file wajib diisi.');
            return;
        }
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
        
        setIsUploading(true);
        const toastId = toast.loading('Mengunggah materi...');
        try {
            // ✅ PERBAIKAN: Gunakan client yang benar dan sesuaikan endpoint
            await apiClient.post('../materials/global', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Materi berhasil diunggah!', { id: toastId });
            setTitle('');
            setFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengunggah materi.', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (materialId: number) => {
        if (window.confirm('Yakin ingin menghapus materi ini?')) {
            const toastId = toast.loading('Menghapus materi...');
            try {
                // ✅ PERBAIKAN: Gunakan client yang benar dan sesuaikan endpoint
                await apiClient.delete(`../materials/global/${materialId}`);
                toast.success('Materi berhasil dihapus.', { id: toastId });
                fetchData();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Gagal menghapus materi.', { id: toastId });
            }
        }
    };

    return (
        <div className="container mx-auto p-8 space-y-8 text-gray-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Materi Global</h1>
                <p className="text-gray-600">Unggah dan kelola materi yang bisa diakses semua pengguna.</p>
            </div>

            {/* Form Upload */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Unggah Materi Baru</h2>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-800">Judul Materi</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-input w-full mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-800">File</label>
                        <input id="file-input" type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required className="form-input w-full mt-1" />
                    </div>
                    <div className="text-right ">
                        <button type="submit" disabled={isUploading} className="btn-primary">
                            {isUploading ? 'Mengunggah...' : 'Unggah'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Daftar Materi Global */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Daftar Materi Tersedia</h2>
                <div className="space-y-3">
                    {isLoading ? <p>Memuat...</p> : materials.map(material => (
                        <div key={material.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50">
                            <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-semibold text-gray-800">
                                <FaFilePdf className="text-red-500" />
                                <span>{material.title}</span>
                            </a>
                            <button onClick={() => handleDelete(material.id)} className="text-gray-500 hover:text-red-600"><FaTrash /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}