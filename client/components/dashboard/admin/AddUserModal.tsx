// Path: src/components/dashboard/admin/AddUserModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import adminApiClient from '@/lib/axiosAdmin';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

interface AvailableClass {
  id: number;
  name: string;
}

const initialState = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  role: 'siswa',
  nisn: '',
  homeroomClassId: '',
};

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'role' && value !== 'wali_kelas') {
        setFormData(prev => ({...prev, homeroomClassId: ''}));
    }
  };

  useEffect(() => {
    if (isOpen && formData.role === 'wali_kelas') {
      const fetchClasses = async () => {
        try {
          // ✅ PERBAIKAN: Endpoint API diubah ke /classes untuk mengambil daftar kelas
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Menyimpan pengguna...');
    try {
      const payload: any = { ...formData };

      if (payload.role !== 'siswa') delete payload.nisn;
      if (payload.role !== 'wali_kelas') delete payload.homeroomClassId;
      
      await adminApiClient.post('/users', payload);
      toast.success('Pengguna baru berhasil ditambahkan!', { id: toastId });
      onUserAdded();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan pengguna.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    onClose();
  };

  return (
    <div className='text-gray-900'>
      {/* ✅ PERUBAHAN 1: Tambahkan prop size="fullscreen" */}
      <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Pengguna Baru" isFullScreen>
        {/* ✅ PERUBAHAN 2: Wrapper untuk menjaga form tetap rapi di tengah */}
        <div className="max-w-xl mx-auto mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ PERUBAHAN 3: Ubah 'max-w-md' menjadi 'w-full' agar konsisten */}
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Nama Lengkap" required className="form-input w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required className="form-input w-full p-2 border border-gray-300 rounded-md" />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="form-input w-full p-2 border border-gray-300 rounded-md" />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="form-input w-full p-2 border border-gray-300 rounded-md" />
            
            <div>
              <label className="block text-sm font-medium">Peran</label>
              <select name="role" value={formData.role} onChange={handleChange} className="form-select w-full p-2 border border-gray-300 rounded-md">
                <option value="siswa">Siswa</option>
                <option value="guru">Guru</option>
                <option value="wali_kelas">Wali Kelas</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'siswa' && (
              <div>
                <label className="block text-sm font-medium">NISN (Opsional)</label>
                <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="NISN" className="form-input w-full p-2 border border-gray-300 rounded-md" />
              </div>
            )}

            {/* ✅ PERUBAHAN 4: Bagian Wali Kelas diaktifkan kembali */}
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

            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
              <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}