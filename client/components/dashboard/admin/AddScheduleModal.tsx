'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
// Impor kedua API client yang dibutuhkan
import classContentApiClient from '@/lib/axiosClassContent';
import scheduleApiClient from '@/lib/axiosSchedule';
import adminApiClient from '@/lib/axiosAdmin'; // Diperlukan untuk mengambil semua guru
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Subject } from '@/types';

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

    const fetchDropdownData = useCallback(async () => {
        try {
            // DIUBAH: Menggunakan client dan endpoint yang benar untuk setiap data
            const classPromise = classContentApiClient.get('/all'); // Benar
            // Ambil daftar guru dari admin-service karena itu sumber utamanya
            const teacherPromise = adminApiClient.get('/teachers');
            // Ambil daftar mapel dari class-content-service
            const subjectPromise = classContentApiClient.get('../subjects');

            const [classRes, teacherRes, subjectRes] = await Promise.all([
                classPromise,
                teacherPromise,
                subjectPromise
            ]);

            setClasses(classRes.data);
            setTeachers(teacherRes.data);
            setSubjects(subjectRes.data);

        } catch (error) {
            console.error("Failed to load form data:", error);
            toast.error("Gagal memuat data untuk form.");
            onClose();
        }
    }, [onClose]);

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
            // DIUBAH: Endpoint untuk POST jadwal adalah '/', bukan '/schedules'
            // karena baseURL sudah mengandung '/api/schedules'
            await scheduleApiClient.post('/', {
                ...formData,
                classId: parseInt(formData.classId),
                subjectId: parseInt(formData.subjectId),
                teacherId: parseInt(formData.teacherId),
            });
            toast.success('Jadwal baru berhasil ditambahkan!', { id: loadingToast });
            onScheduleAdded();
            handleClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menambahkan jadwal.', { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(initialState);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Jadwal Pelajaran Baru" isFullScreen>
            <div className="flex flex-col h-full text-gray-800">
                <form id="add-schedule-form" onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="flex-grow overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor="classId" className="block text-sm font-bold mb-1">Kelas</label>
                                    <select id="classId" name="classId" value={formData.classId} onChange={handleChange} required className="form-select px-4 py-3 rounded-md border w-full">
                                        <option value="" disabled>Pilih Kelas</option>
                                        {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dayOfWeek" className="block text-sm font-bold mb-1">Hari</label>
                                    <select id="dayOfWeek" name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required className="form-select px-4 py-3 rounded-md border w-full">
                                        <option value="SENIN">Senin</option>
                                        <option value="SELASA">Selasa</option>
                                        <option value="RABU">Rabu</option>
                                        <option value="KAMIS">Kamis</option>
                                        <option value="JUMAT">Jumat</option>
                                        <option value="SABTU">Sabtu</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="subjectId" className="block text-sm font-bold mb-1">Mata Pelajaran</label>
                                    <select id="subjectId" name="subjectId" value={formData.subjectId} onChange={handleChange} required className="form-select px-4 py-3 rounded-md border w-full">
                                        <option value="" disabled>Pilih Mata Pelajaran</option>
                                        {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} (Kelas {sub.grade})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="teacherId" className="block text-sm font-bold mb-1">Guru Pengajar</label>
                                    <select id="teacherId" name="teacherId" value={formData.teacherId} onChange={handleChange} required className="form-select px-4 py-3 rounded-md border w-full">
                                        <option value="" disabled>Pilih Guru</option>
                                        {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="startTime" className="block text-sm font-bold mb-1">Jam Mulai</label>
                                    <input id="startTime" type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="form-input px-4 py-3 rounded-md border w-full" />
                                </div>
                                <div>
                                    <label htmlFor="endTime" className="block text-sm font-bold mb-1">Jam Selesai</label>
                                    <input id="endTime" type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="form-input px-4 py-3 rounded-md border w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <div className="max-w-4xl mx-auto flex justify-end gap-4">
                            <button type="button" onClick={handleClose} className="btn-secondary">
                                Batal
                            </button>
                            <button type="submit" form="add-schedule-form" disabled={isLoading} className="btn-primary">
                                {isLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}