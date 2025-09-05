// Path: client/app/admin/jadwal/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/axios';
import { FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AddScheduleModal from '@/components/dashboard/admin/AddScheduleModal';

// Interface sudah benar
interface Schedule {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    class: { name: string; };
    subject: { name: string; };
    teacher: { fullName: string; };
}

export default function ManageSchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ PERBAIKAN: Panggil endpoint root ('/') dari baseURL
            const response = await apiClient.get('/');
            setSchedules(response.data);
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error("Akses ditolak. Anda tidak memiliki peran yang sesuai.");
            } else {
                toast.error("Gagal memuat data jadwal.");
            }
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleScheduleAdded = () => {
        fetchData();
        setIsModalOpen(false);
    };

    // Fungsi handleDelete sudah benar
    const handleDelete = async (scheduleId: number) => {
        toast.promise(
            apiClient.delete(`/${scheduleId}`),
            {
                loading: 'Menghapus jadwal...',
                success: 'Jadwal berhasil dihapus!',
                error: 'Gagal menghapus jadwal.'
            }
        ).then(() => {
            fetchData();
        }).catch((error) => {
            console.error('Error deleting schedule:', error);
        });
    };

    return (
        <>
            <AddScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onScheduleAdded={handleScheduleAdded}
            />
            <div className="container mx-auto p-4 md:p-8 text-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Manajemen Jadwal Pelajaran</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                    >
                        + Tambah Jadwal
                    </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr className='bg-yellow-200 text-gray-700 border font-bold font-large text-left text-l uppercase'>
                                <th className="py-3 px-4 border border-gray-300">Hari</th>
                                <th className="py-3 px-4 border border-gray-300">Waktu</th>
                                <th className="py-3 px-4 border border-gray-300">Kelas</th>
                                <th className="py-3 px-4 border border-gray-300">Mata Pelajaran</th>
                                <th className="py-3 px-4 border border-gray-300">Guru</th>
                                <th className="py-3 px-4 border border-gray-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-4 text-center">Memuat jadwal...</td></tr>
                            ) : schedules.length > 0 ? schedules.map(schedule => (
                                <tr key={schedule.id} className="border-b">
                                    <td className="py-3 px-4 font-semibold capitalize">{schedule.dayOfWeek.toLowerCase()}</td>
                                    <td className="py-3 px-4">{schedule.startTime} - {schedule.endTime}</td>
                                    <td className="py-3 px-4">{schedule.class.name}</td>
                                    <td className="py-3 px-4">{schedule.subject.name}</td>
                                    <td className="py-3 px-4">{schedule.teacher.fullName}</td>
                                    <td className="py-3 px-4">
                                        <button onClick={() => handleDelete(schedule.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Belum ada jadwal yang dibuat.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}