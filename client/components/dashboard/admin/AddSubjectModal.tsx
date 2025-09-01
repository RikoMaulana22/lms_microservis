'use client';

import { useState, FormEvent } from 'react';
// DIUBAH: Impor client yang benar untuk class-content-service
import classContentApiClient from '@/lib/axiosClassContent';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectAdded: () => void;
}

const initialState = { name: '', grade: '7' };

export default function AddSubjectModal({ isOpen, onClose, onSubjectAdded }: AddSubjectModalProps) {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading('Menambahkan mata pelajaran...');
    try {
      // DIUBAH: Menggunakan client yang benar dan endpoint yang disesuaikan
      await classContentApiClient.post('../subjects', {
        ...formData,
        grade: parseInt(formData.grade, 10), // Kirim grade sebagai angka
      });
      toast.success('Mata pelajaran baru berhasil ditambahkan!', { id: loadingToast });
      onSubjectAdded();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan mapel.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Mata Pelajaran Baru" isFullScreen>
      <div className="flex flex-col h-full">
        <div className="flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit} id="add-subject-form" className="h-full flex flex-col">
            <div className="flex-grow p-6">
              <div className="max-w-xl mx-auto">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                      Nama Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="form-input px-4 py-3 w-full border border-gray-600 text-gray-700 rounded-md"
                      placeholder="Contoh: Matematika"
                    />
                  </div>
                  <div>
                    <label htmlFor="grade" className="block text-sm font-bold text-gray-700 mb-1">
                      Tingkat Kelas
                    </label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="form-select px-4 py-3 border border-gray-600  text-gray-700 w-full rounded-md"
                    >
                      <option value="7">Kelas 7</option>
                      <option value="8">Kelas 8</option>
                      <option value="9">Kelas 9</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="max-w-xl mx-auto flex justify-end gap-4">
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" form="add-subject-form" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Menyimpan...' : 'Simpan Mata Pelajaran'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}