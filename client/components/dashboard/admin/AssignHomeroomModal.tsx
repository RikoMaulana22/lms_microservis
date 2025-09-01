// Path: client/components/admin/AssignHomeroomModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
// DIUBAH: Impor juga adminApiClient untuk mengambil data guru
import homeroomApiClient from '@/lib/axiosHomeroom';
import adminApiClient from '@/lib/axiosAdmin'; 
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { User } from '@/types';

interface AssignHomeroomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedClass: { id: number; name: string } | null;
}

export default function AssignHomeroomModal({ isOpen, onClose, onSuccess, selectedClass }: AssignHomeroomModalProps) {
    const [teachers, setTeachers] = useState<User[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchTeachers = async () => {
                try {
                    // DIUBAH: Menggunakan adminApiClient untuk mengambil daftar semua guru
                    const res = await adminApiClient.get('/teachers');
                    setTeachers(res.data);
                } catch (error) {
                    toast.error("Gagal memuat daftar guru.");
                }
            };
            fetchTeachers();
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!selectedTeacherId) {
            toast.error("Silakan pilih seorang guru.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Menyimpan...");

        try {
            // INI SUDAH BENAR: Menggunakan homeroomApiClient untuk menetapkan wali kelas
            await homeroomApiClient.put(`/admin/classes/${selectedClass?.id}/assign-homeroom`, {
                // DIUBAH: Pastikan ID dikirim sebagai angka
                teacherId: parseInt(selectedTeacherId, 10) 
            });
            toast.success("Wali kelas berhasil ditetapkan!", { id: toastId });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal menetapkan wali kelas.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Reset state saat modal ditutup
    const handleClose = () => {
        setSelectedTeacherId('');
        onClose();
    };

    return (
        <div className="text-gray-800">
        <Modal isOpen={isOpen} onClose={handleClose} title={`Setel Wali Kelas untuk ${selectedClass?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Pilih Guru</label>
                    <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="form-select w-full mt-1"
                        required
                    >
                        <option value="" disabled>-- Pilih Guru --</option>
                        {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={handleClose} className="btn-secondary">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </Modal>
        </div>
    );
}