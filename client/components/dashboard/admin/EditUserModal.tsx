'use client';

import { useState, FormEvent, useEffect } from 'react';
import adminApiClient from '@/lib/axiosAdmin';
import Modal from '@/components/ui/Modal';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUserUpdated: () => void;
}

// ✅ TAMBAHAN: Definisikan tipe untuk kelas yang diambil
interface AvailableClass {
    id: number;
    name: string;
}

export default function EditUserModal({ isOpen, onClose, user, onUserUpdated }: EditUserModalProps) {
    // ✅ TAMBAHAN: Tambahkan homeroomClassId ke state
    const [formData, setFormData] = useState({ fullName: '', username: '', role: 'siswa', nisn: '', password: '', homeroomClassId: '' });
    const [isLoading, setIsLoading] = useState(false);
    // ✅ TAMBAHAN: State untuk menyimpan daftar kelas
    const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);

    useEffect(() => {
        // Mengisi form saat data pengguna tersedia
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                username: user.username || '',
                role: user.role || 'siswa',
                nisn: user.nisn || '',
                password: '',
                // ✅ TAMBAHAN: Isi homeroomClassId jika ada
                homeroomClassId: user.homeroomClassId?.toString() || '',
            });
        }
    }, [user]);

    // ✅ TAMBAHAN: Logika untuk mengambil data kelas jika peran adalah wali_kelas
    useEffect(() => {
        if (isOpen && formData.role === 'wali_kelas') {
            const fetchClasses = async () => {
                try {
                    const response = await adminApiClient.get('/classes');
                    setAvailableClasses(response.data);
                } catch (error) {
                    toast.error("Gagal memuat daftar kelas.");
                }
            };
            fetchClasses();
        } else {
            setAvailableClasses([]);
        }
    }, [isOpen, formData.role]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset homeroomClassId jika peran bukan wali_kelas
        if (name === 'role' && value !== 'wali_kelas') {
            setFormData(prev => ({ ...prev, homeroomClassId: '' }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        const loadingToast = toast.loading('Memperbarui data...');
        try {
            const payload: any = { ...formData };
            
            // Hapus field yang tidak perlu berdasarkan peran
            if (!payload.password) delete payload.password;
            if (payload.role !== 'siswa') delete payload.nisn;
            
            // ✅ PERBAIKAN: Logika penanganan homeroomClassId yang lebih baik
            if (payload.role === 'wali_kelas' && payload.homeroomClassId) {
                payload.homeroomClassId = parseInt(payload.homeroomClassId, 10);
            } else {
                delete payload.homeroomClassId;
            }

            // Pemanggilan API ini sudah benar
            await adminApiClient.put(`/users/${user.id}`, payload);
            toast.success('Data berhasil diperbarui!', { id: loadingToast });
            onUserUpdated();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui data.', { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-gray-800">
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Pengguna: ${user?.fullName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Nama Lengkap</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input mt-1 w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required className="form-input mt-1 w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Peran</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="form-select mt-1 w-full">
                        <option value="siswa">Siswa</option>
                        <option value="guru">Guru</option>
                        <option value="wali_kelas">Wali Kelas</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                {formData.role === 'siswa' && (
                    <div>
                        <label className="block text-sm font-medium">NISN (Opsional)</label>
                        <input type="text" name="nisn" value={formData.nisn || ''} onChange={handleChange} className="form-input mt-1 w-full" />
                    </div>
                )}
                {/* ✅ TAMBAHAN: Tampilkan pilihan kelas untuk Wali Kelas */}
                {formData.role === 'wali_kelas' && (
                    <div>
                        <label className="block text-sm font-medium">Tugaskan ke Kelas</label>
                        <select name="homeroomClassId" value={formData.homeroomClassId} onChange={handleChange} required className="form-select w-full p-2 border border-gray-300 rounded-md">
                            <option value="">-- Pilih Kelas --</option>
                            {availableClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium">Password Baru (Opsional)</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input mt-1 w-full" placeholder="Kosongkan jika tidak diubah" />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </Modal>
        </div>
    );
}