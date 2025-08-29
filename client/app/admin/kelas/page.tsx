"use client";

import { useState, useEffect, useCallback } from 'react';
import adminApiClient from '@/lib/axiosAdmin';
import CreateClassModal from '@/components/dashboard/CreateClassModal'; // Pastikan nama komponen ini benar
import EditClassModal from '@/components/dashboard/admin/EditClassModal';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ClassInfo } from '@/types';

// Interface untuk data kelas yang akan ditampilkan


export default function ClassManagementPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState<string>('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = selectedGrade ? `/classes?grade=${selectedGrade}` : `/classes`;
            const response = await adminApiClient.get(url);
            setClasses(response.data);
        } catch (error) {
            toast.error("Gagal memuat data kelas.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedGrade]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenEditModal = (cls: ClassInfo) => {
        setSelectedClass(cls);
        setIsEditModalOpen(true);
    };

    const handleDeleteClass = async (classId: number) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

        const toastId = toast.loading('Menghapus kelas...');
        try {
            await adminApiClient.delete(`/classes/${classId}`);
            toast.success('Kelas berhasil dihapus.', { id: toastId });
            fetchData();
        } catch (error) {
            toast.error('Gagal menghapus kelas.', { id: toastId });
        }
    };

    // --- PERBAIKAN DI SINI ---
    // Gunakan useCallback untuk menstabilkan fungsi-fungsi ini agar tidak dibuat ulang setiap render
    const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);
    const handleCloseEditModal = useCallback(() => setIsEditModalOpen(false), []);
    // -------------------------

    if (isLoading && classes.length === 0) return <div className="p-8 text-center">Memuat Kelas...</div>;

    return (
        <div className="container mx-auto p-4 text-gray-600 md:p-8">
            {/* --- PERBAIKAN DI SINI --- */}
            {/* Gunakan fungsi yang sudah di-memoize dengan useCallback */}
            <CreateClassModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onClassCreated={fetchData}
            />
            <EditClassModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onClassUpdated={fetchData}
                classData={selectedClass} // ✅ Sekarang tipe datanya akan cocok
            />
            {/* ------------------------- */}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Kelas</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
                    + Tambah Kelas Baru
                </button>
            </div>

            <div className="mb-4 flex justify-end">
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-medium mb-1">Filter Berdasarkan Kelas</label>
                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="form-select font-bold w-full bg-white border border-gray-300 rounded-md px-4 py-2"
                    >
                        <option value="">Semua Kelas</option>
                        <option value="7">Kelas 7</option>
                        <option value="8">Kelas 8</option>
                        <option value="9">Kelas 9</option>
                    </select>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className='bg-yellow-200 text-gray-700 border font-bold text-left uppercase'>
                            <th className="px-6 py-3 border">Nama Kelas</th>
                            <th className="px-6 py-3 border">Mata Pelajaran</th>
                            <th className="px-6 py-3 border">Guru Pengajar</th>
                            <th className="px-6 py-3 border">Wali Kelas</th>
                            <th className="px-6 py-3 border">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {!isLoading && classes.map(cls => (
                            <tr key={cls.id}>
                                <td className="px-6 py-4 border">{cls.name}</td>

                                {/* --- PERBAIKAN DI SINI (SAFE ACCESS) --- */}
                                <td className="px-6 py-4 border">
                                    {cls.subject?.name || 'Tanpa Mapel'} (Kelas {cls.subject?.grade || 'N/A'})
                                </td>
                                <td className="px-6 py-4 border">
                                    {cls.teacher?.fullName || 'Belum Ditentukan'}
                                </td>
                                {/* ----------------------------------------- */}

                                <td className="px-6 py-4 border">{cls.homeroomTeacher?.fullName || 'Belum Ditentukan'}</td>
                                <td className="px-6 py-4 border space-x-4">
                                    <button onClick={() => handleOpenEditModal(cls)} className="text-indigo-600 hover:underline font-semibold text-sm">
                                        Edit
                                    </button>
                                    <Link href={`/admin/classes/${cls.id}/enroll`} className="text-blue-600 hover:underline font-semibold text-sm">
                                        Pendaftaran
                                    </Link>
                                    <button onClick={() => handleDeleteClass(cls.id)} className="text-red-600 hover:underline font-semibold text-sm">
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}