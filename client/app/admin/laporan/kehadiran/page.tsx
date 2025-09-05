// Path: client/app/admin/laporan/kehadiran/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
// ✅ BENAR: Menggunakan adminApiClient sudah tepat untuk laporan.
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast'; // Impor toast untuk notifikasi error

// Tipe data sudah benar
interface AttendanceReportItem {
    classId: number;
    className: string;
    teacherName: string;
    totalStudents: number;
    topicTitle: string;
    attendanceTitle: string;
    studentsPresent: number;
    openTime: string;
}

export default function AttendanceReportPage() {
    const [reportData, setReportData] = useState<AttendanceReportItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ PANGGILAN API INI SUDAH BENAR
            // admin-service bertindak sebagai gateway untuk mengumpulkan data laporan
            // dari berbagai layanan lain, termasuk attendance-service.
            const response = await apiClient.get(`/reports/attendance`);
            setReportData(response.data);
        } catch (error) {
            toast.error("Gagal memuat laporan kehadiran."); // Menggunakan toast untuk notifikasi
            console.error("Gagal mengambil laporan:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="container mx-auto p-4 md:p-8 text-gray-800">
            <h1 className="text-3xl font-bold mb-6">Laporan Kehadiran</h1>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr className='bg-yellow-200 text-gray-700 border font-bold font-large text-left text-l uppercase'>
                            <th className="py-3 px-4 border border-gray-300">Kelas</th>
                            <th className="py-3 px-4 border border-gray-300">Topik / Sesi</th>
                            <th className="py-3 px-4 border border-gray-300">Guru</th>
                            <th className="py-3 px-4 border border-gray-300 text-center">Jumlah Hadir</th>
                            <th className="py-3 px-4 border border-gray-300 text-center">Tingkat Kehadiran</th>
                            <th className="py-3 px-4 border border-gray-300">Waktu Absensi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="py-4 text-center">Memuat data laporan...</td></tr>
                        ) : reportData.length > 0 ? reportData.map((item, index) => {
                            const attendanceRate = item.totalStudents > 0 
                                ? ((item.studentsPresent / item.totalStudents) * 100).toFixed(1) 
                                : 0;
                            return (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{item.className}</td>
                                    <td className="py-3 px-4">{item.attendanceTitle}</td>
                                    <td className="py-3 px-4">{item.teacherName}</td>
                                    <td className="py-3 px-4 text-center">{item.studentsPresent} / {item.totalStudents}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${Number(attendanceRate) >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {attendanceRate}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{new Date(item.openTime).toLocaleDateString('id-ID')}</td>
                                </tr>
                            )
                        }) : (
                            <tr><td colSpan={6} className="py-4 text-center text-gray-500">Tidak ada data kehadiran untuk ditampilkan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}