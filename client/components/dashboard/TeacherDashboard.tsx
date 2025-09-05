'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import toast from 'react-hot-toast';
import CreateClassModal from './CreateClassModal';
import AnnouncementSection from './AnnouncementSection';
import GlobalMaterialsSection from './GlobalMaterialsSection';
import TodayScheduleSection from './TodayScheduleSection';
export type UserRole = 'siswa' | 'guru' | 'admin' | 'wali_kelas';

export interface GlobalMaterial {
  id: number;
  title: string;
  fileUrl: string;
}
export interface ClassSummary {
  id: number;
  name: string;
  description: string | null;
  imageUrl?: string | null; 
  subject: {
    name: string;
  };
  Teacher: {
    fullName: string;
    id: number;
  };
  _count: {
    members: number;
  };
}

export interface User {
  id: number;
  fullName: string;
  username: string; // sekarang sudah ada
  role: UserRole;
  email: string;
  createdAt?: string;
  nisn?: string | null;        // opsional
  homeroomClassId?: number;    // opsional
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    fullName: string;
  };
}



// Definisikan tipe untuk jadwal karena belum ada di shared/types
// (Jika sudah ada, impor dari @shared/types)
export interface ScheduleItem {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: { name: string };
  class: { id?: number; name: string };
}

export default function TeacherDashboard({ user }: { user: User }) {
  const [myClasses, setMyClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [globalMaterials, setGlobalMaterials] = useState<GlobalMaterial[]>([]);
  const [mySchedules, setMySchedules] = useState<ScheduleItem[]>([]);

  // Fungsi untuk mengambil semua data, bisa dipanggil ulang
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        myClassesResponse,
        announcementsResponse,
        globalMaterialsResponse,
        schedulesResponse
      ] = await Promise.all([
        apiClient.get('/classes/teacher'),
        apiClient.get('/announcements'),
        apiClient.get('/materials/global'),
        apiClient.get('/schedules/my')
      ]);

      setMyClasses(myClassesResponse.data);
      setAnnouncements(announcementsResponse.data);
      setGlobalMaterials(globalMaterialsResponse.data);
      setMySchedules(schedulesResponse.data);
    } catch (error) {
      console.error('Gagal mengambil data dashboard guru:', error);
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  // PERBAIKAN: useEffect yang lebih sederhana untuk fetch data awal
  useEffect(() => {
    fetchAllData();
  }, []); // Dependensi kosong agar hanya berjalan sekali saat komponen dimuat

  const handleEditClass = (classId: number) => {
    console.log('Edit kelas dengan ID:', classId);
    // TODO: Implementasi modal edit atau redirect ke halaman edit
    toast.error('Fitur edit belum diimplementasikan.');
  };

  const handleDeleteClass = async (classId: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kelas ini? Ini tidak dapat diurungkan.')) return;

    const toastId = toast.loading('Menghapus kelas...');
    try {
      await apiClient.delete(`/classes/${classId}`);
      toast.success('Kelas berhasil dihapus.', { id: toastId });
      fetchAllData(); // Refresh data setelah berhasil menghapus
    } catch (error: any) {
      console.error('Gagal menghapus kelas:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus kelas.', { id: toastId });
    }
  };

  return (
    <>
      <div className="container mx-auto p-4 md:p-8 space-y-8 text-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Guru</h1>
            <p className="text-gray-600">Selamat datang kembali, {user.fullName}!</p>
          </div>
          {/* Tambahkan tombol untuk membuka modal */}
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            + Buat Kelas Baru
          </button>
        </div>

        {/* Sections */}
        <AnnouncementSection isLoading={isLoading} announcements={announcements} />
        <TodayScheduleSection isLoading={isLoading} schedules={mySchedules} />
        <GlobalMaterialsSection isLoading={isLoading} materials={globalMaterials} />

        {/* Section Kelas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Kelas yang Anda Ajar</h2>
          {isLoading ? (
            <p>Memuat data kelas...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.length > 0 ? (
                myClasses.map((cls) => (
                  <div key={cls.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-all flex flex-col">
                    <div className="h-32 bg-gray-200 flex items-center justify-center">
                      {cls.imageUrl ? (
                        <img src={cls.imageUrl} alt={cls.name} className="h-full w-full object-cover"/>
                      ) : (
                        <span className="text-gray-400 text-sm">Tidak Ada Gambar</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div>
                        <Link href={`/kelas/${cls.id}`}>
                          <h3 className="font-bold text-lg text-gray-800 hover:text-blue-600 hover:underline cursor-pointer">{cls.name}</h3>
                        </Link>
                        <p className="text-sm text-gray-500">{cls.subject.name}</p>
                        <p className="text-sm mt-2 font-semibold text-gray-700">{cls._count.members} Siswa</p>
                      </div>
                    </div>
                    <div className="p-4 border-t flex gap-4">
                      <button onClick={() => handleEditClass(cls.id)} className="text-blue-600 hover:underline text-sm">Edit</button>
                      <button onClick={() => handleDeleteClass(cls.id)} className="text-red-600 hover:underline text-sm">Hapus</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Anda belum membuat kelas.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Buat Kelas */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClassCreated={fetchAllData} // Refresh data setelah membuat kelas
      />
    </>
  );
}