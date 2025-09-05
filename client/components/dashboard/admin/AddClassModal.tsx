'use client';

import { useState, useEffect, FormEvent } from 'react';
// DIUBAH: Impor client yang benar untuk class-content-service
import apiClient from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';


export interface Teacher { 
  id: number; 
  fullName: string; 
}
export interface Subject {
  id: number;
  name: string;
  grade: number;
  Class: ClassInfo[]; 
}

export interface ClassInfo {
  id: number;
  name: string;
  description?: string;
  subject: Subject;
  teacher: Teacher;             // pengajar utama
  homeroomTeacher?: Teacher;    // wali kelas opsional
  _count?: {
    members?: number;
  };
}
interface AddClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClassCreated: () => void;
}

export default function AddClassModal({ isOpen, onClose, onClassCreated }: AddClassModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setName('');
            setDescription('');
            setSubjectId('');
            setTeacherId('');
            setHomeroomTeacherId('');

            const fetchPrerequisites = async () => {
                try {
                    // DIUBAH: Memanggil layanan yang benar untuk setiap data
                    const [teachersRes, subjectsRes] = await Promise.all([
                        apiClient.get('/teachers'), // Data guru dari admin-service
                        // Data mapel dari class-content-service.
                        // AxiosClassContent base URL adalah '/api/classes', jadi kita perlu ke '../subjects'
                        apiClient.get('/subjects')
                    ]);
                    setTeachers(teachersRes.data);
                    setSubjects(subjectsRes.data);
                } catch (error) {
                    toast.error("Gagal memuat data guru/mapel.");
                    console.error("Prerequisite fetch error:", error);
                }
            };
            fetchPrerequisites();
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!subjectId || !teacherId || !homeroomTeacherId) {
            toast.error("Harap lengkapi semua pilihan.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Menambahkan kelas...");
        try {
            // DIUBAH: Menggunakan client dan endpoint yang benar untuk membuat kelas
            // Endpointnya adalah '/' karena baseURL dari apiClient sudah '/api/classes'
            await apiClient.post('/classes', {
                name,
                description,
                // Pastikan ID dikirim sebagai angka jika backend mengharapkannya
                subjectId: parseInt(subjectId, 10),
                teacherId: parseInt(teacherId, 10),
                homeroomTeacherId: parseInt(homeroomTeacherId, 10)
            });
            toast.success("Kelas berhasil ditambahkan!", { id: toastId });
            onClassCreated(); // Memanggil fungsi dari parent untuk re-fetch data
            onClose(); // Menutup modal
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal menambahkan kelas.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Kelas Baru">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input border px-4 py-2 rounded-md w-full mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-textarea border px-4 py-2 rounded-md w-full mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required className="form-select border px-4 py-2 rounded-md w-full mt-1">
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name} (Kelas {subject.grade})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Guru Pengajar</label>
                    <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required className="form-select border px-4 py-2 rounded-md w-full mt-1">
                        <option value="">-- Pilih Guru --</option>
                        {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Wali Kelas</label>
                    <select value={homeroomTeacherId} onChange={e => setHomeroomTeacherId(e.target.value)} required className="form-select  border px-4 py-2 rounded-md w-full mt-1">
                        <option value="">-- Pilih Wali Kelas --</option>
                        {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                        {isLoading ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}