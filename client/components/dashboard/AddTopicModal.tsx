// Path: client/components/dashboard/AddTopicModal.tsx
'use client';

import { useState, FormEvent } from 'react';
// ✅ BENAR: API client ini sudah benar
import classContentApiClient from '@/lib/axiosClassContent';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast'; // ✅ TAMBAHAN: Gunakan toast untuk notifikasi

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  nextOrder: number;
  onTopicCreated: () => void;
}

export default function AddTopicModal({ isOpen, onClose, classId, nextOrder, onTopicCreated }: AddTopicModalProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Judul topik tidak boleh kosong.');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Membuat topik...');

    try {
      // ✅ PERBAIKAN: Endpoint sudah benar, tidak perlu diubah.
      // baseURL '/api/classes' + '/:classId/topics'
      await classContentApiClient.post(`/${classId}/topics`, {
        title,
        order: nextOrder,
      });
      toast.success('Topik berhasil dibuat!', { id: toastId });
      onTopicCreated();
      onClose();
      setTitle('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat topik.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" text-gray-600">
      <Modal isOpen={isOpen} onClose={onClose} title="Buat Topik Baru">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-gray-700">
            <label htmlFor="topic-title" className="block text-sm font-medium text-gray-700">
              Judul Topik
            </label>
            <input
              type="text"
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Contoh: Pertemuan 1 - Pengenalan"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Menyimpan...' : 'Simpan Topik'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}