'use client';

import { useState, useEffect, useCallback } from 'react';
// PERBAIKAN 1: Impor client yang TEPAT untuk schedule-service
import axiosSchedule from '@/lib/axiosSchedule'; 
import axiosClassContent from '@/lib/axiosClassContent';
import axiosUser from '@/lib/axiosUser';
import { FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AddScheduleModal from '@/components/dashboard/admin/AddScheduleModal';

// PERBAIKAN 2: Sesuaikan interface dengan tipe data number dari controller
interface Schedule {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    classId: number;
    subjectId: number;
    teacherId: number;
}

// Komponen untuk mengambil dan menampilkan nama berdasarkan ID
const DataFetcher = ({ service, endpoint, id, field }: { service: any, endpoint: string, id: number, field: string }) => {
    const [name, setName] = useState(`Memuat...`);
    
    useEffect(() => {
        const fetchName = async () => {
            try {
                // Asumsi endpoint untuk mengambil satu item adalah /<endpoint>/:id
                const response = await service.get(`/${endpoint}/${id}`);
                setName(response.data[field] || `Tidak Ditemukan`);
            } catch (error) {
                console.error(`Gagal memuat data untuk id ${id} dari ${endpoint}:`, error);
                setName(`Error`);
            }
        };
        if (id) fetchName();
    }, [id, service, endpoint, field]);

    return <>{name}</>;
};

export default function ManageSchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // PERBAIKAN 3: Gunakan axiosSchedule dan panggil endpoint root-nya ('/')
            const response = await axiosSchedule.get('/'); 
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

    const handleDelete = async (scheduleId: number) => { // ID adalah number
        if (window.confirm('Yakin ingin menghapus jadwal ini?')) {
            try {
                await axiosSchedule.delete(`/${scheduleId}`);
                toast.success("Jadwal berhasil dihapus.");
                fetchData();
            } catch (error) {
                toast.error('Gagal menghapus jadwal.');
            }
        }
    };

    return (
        <>
            <AddScheduleModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onScheduleAdded={fetchData}
            />
            <div className="container mx-auto p-4 md:p-8 text-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Manajemen Jadwal Pelajaran</h1>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                    >
                        + Tambah Jadwal
                    </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        {/* ... Thead tetap sama ... */}
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
                                    {/* PERBAIKAN 4: Gunakan DataFetcher untuk menampilkan nama */}
                                    <td className="py-3 px-4">
                                        <DataFetcher service={axiosClassContent} endpoint="classes" id={schedule.classId} field="name" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <DataFetcher service={axiosClassContent} endpoint="subjects" id={schedule.subjectId} field="name" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <DataFetcher service={axiosUser} endpoint="users" id={schedule.teacherId} field="fullName" />
                                    </td>
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