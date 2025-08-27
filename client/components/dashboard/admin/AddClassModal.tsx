// client/components/dashboard/admin/EditClassModal.tsx

'use client';

import { useState, useEffect, FormEvent } from 'react';
import adminApiClient from '@/lib/axiosAdmin';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface Teacher { id: number; fullName: string; }
interface Subject { id: number; name: string; }
interface ClassInfo { id: number; name: string; description?: string; subject: { id: number }; teacher: { id: number }; }

interface EditClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClassUpdated: () => void;
    classData: ClassInfo | null;
}

export default function EditClassModal({ isOpen, onClose, onClassUpdated, classData }: EditClassModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchPrerequisites = async () => {
                try {
                    const [teachersRes, subjectsRes] = await Promise.all([
                        adminApiClient.get('/teachers'),
                        adminApiClient.get('/subjects')
                    ]);
                    setTeachers(teachersRes.data);
                    setSubjects(subjectsRes.data);
                } catch (error) {
                    toast.error("Gagal memuat data guru/mapel.");
                }
            };
            fetchPrerequisites();
        }
        if (classData) {
            setName(classData.name);
            setDescription(classData.description || '');
            setSubjectId(classData.subject.id.toString());
            setTeacherId(classData.teacher.id.toString());
        }
    }, [isOpen, classData]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!classData) return;
        setIsLoading(true);
        const toastId = toast.loading("Memperbarui kelas...");
        try {
            await adminApiClient.put(`/classes/${classData.id}`, { name, description, subjectId, teacherId });
            toast.success("Kelas berhasil diperbarui!", { id: toastId });
            onClassUpdated();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal memperbarui kelas.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Kelas: ${classData?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields (sama seperti AddClassModal) */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input w-full mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-textarea w-full mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required className="form-select w-full mt-1">
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Guru Pengajar</label>
                    <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required className="form-select w-full mt-1">
                        <option value="">-- Pilih Guru --</option>
                        {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}