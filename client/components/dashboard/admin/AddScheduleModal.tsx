'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import classContentApiClient from '@/lib/axiosClassContent';
import scheduleApiClient from '@/lib/axiosSchedule';
// adminApiClient is no longer needed for teachers
// import adminApiClient from '@/lib/axiosAdmin'; 
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Subject } from '@/types'; // Assuming Subject is correctly typed

// Define clearer interfaces for the data
interface Class {
    id: number;
    name: string;
}

interface Teacher {
    id: number;
    fullName: string;
}

interface AddScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScheduleAdded: () => void;
}

// Initial state for the form
const initialState = {
    dayOfWeek: 'SENIN',
    startTime: '07:00',
    endTime: '08:30',
    classId: '',
    subjectId: '',
    teacherId: ''
};

export default function AddScheduleModal({ isOpen, onClose, onScheduleAdded }: AddScheduleModalProps) {
    const [formData, setFormData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Use useCallback to memoize the data fetching function
    const fetchDropdownData = useCallback(async () => {
        const loadingToast = toast.loading("Memuat data form...");
        try {
            // Define all API promises
            const classPromise = classContentApiClient.get('/classes/all');
            
            // ====================== PERBAIKAN DI SINI ======================
            // Panggil endpoint /teachers dari scheduleApiClient yang sudah kita buat.
            // Ini akan mengambil data guru (bukan admin) dari user-service.
            const teacherPromise = scheduleApiClient.get('/schedules/teachers');

            const subjectPromise = classContentApiClient.get('/subjects');

            // Wait for all promises to resolve
            const [classRes, teacherRes, subjectRes] = await Promise.all([
                classPromise,
                teacherPromise,
                subjectPromise
            ]);

            setClasses(classRes.data);
            setTeachers(teacherRes.data);
            setSubjects(subjectRes.data);

            toast.dismiss(loadingToast);
        } catch (error) {
            console.error("Failed to load form data:", error);
            toast.error("Gagal memuat data untuk form.", { id: loadingToast });
        }
    }, []);

    // Fetch data only when the modal opens
    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
        }
    }, [isOpen, fetchDropdownData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingToast = toast.loading('Menyimpan jadwal...');
        try {
            // ====================== PERBAIKAN KEDUA ======================
            // Endpoint untuk membuat jadwal adalah '/' (root) dari scheduleApiClient
            await scheduleApiClient.post('/schedules', formData);

            toast.success('Jadwal baru berhasil ditambahkan!', { id: loadingToast });
            onScheduleAdded(); // Refresh data di halaman utama
            handleClose(); // Tutup modal dan reset form
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menambahkan jadwal.', { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    // Function to close and reset the modal
    const handleClose = () => {
        setFormData(initialState);
        onClose();
    };

    return (
        <div className="text-gray-800">
            <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Jadwal Pelajaran Baru">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Select Kelas */}
                    <div>
                        <label className="block text-sm font-medium">Kelas</label>
                        <select name="classId" value={formData.classId} onChange={handleChange} required className="form-select mt-1 w-full">
                            <option value="" disabled>Pilih Kelas</option>
                            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                        </select>
                    </div>

                    {/* Select Hari */}
                    <div>
                        <label className="block text-sm font-medium">Hari</label>
                        <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required className="form-select mt-1 w-full">
                            <option value="SENIN">Senin</option>
                            <option value="SELASA">Selasa</option>
                            <option value="RABU">Rabu</option>
                            <option value="KAMIS">Kamis</option>
                            <option value="JUMAT">Jumat</option>
                            <option value="SABTU">Sabtu</option>
                        </select>
                    </div>
                    
                    {/* Select Mata Pelajaran */}
                    <div>
                        <label className="block text-sm font-medium">Mata Pelajaran</label>
                        <select name="subjectId" value={formData.subjectId} onChange={handleChange} required className="form-select mt-1 w-full">
                            <option value="" disabled>Pilih Mata Pelajaran</option>
                            {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} (Kelas {sub.grade})</option>)}
                        </select>
                    </div>

                    {/* Select Guru Pengajar */}
                    <div>
                        <label className="block text-sm font-medium">Guru Pengajar</label>
                        <select name="teacherId" value={formData.teacherId} onChange={handleChange} required className="form-select mt-1 w-full">
                            <option value="" disabled>Pilih Guru</option>
                            {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                        </select>
                    </div>

                    {/* Jam Mulai & Selesai */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Jam Mulai</label>
                            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="form-input mt-1 w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Jam Selesai</label>
                            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="form-input mt-1 w-full" />
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">
                            {isLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}