'use client';

import { useState, FormEvent, useEffect } from 'react';
import apiClient from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// Definisikan tipe data untuk Topic
type TopicInfo = {
  id: string | number;
  title: string;
};

interface EditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicInfo | null;
  onTopicUpdated: () => void;
}

export default function EditTopicModal({ isOpen, onClose, topic, onTopicUpdated }: EditTopicModalProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mengisi form dengan judul topik saat ini ketika modal dibuka atau data topik berubah
  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
    }
  }, [topic]);

  // Fungsi untuk menangani submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Mencegah halaman refresh
    if (!topic) return;

    setIsLoading(true);
    const loadingToast = toast.loading('Menyimpan perubahan...');

    try {
      // Mengirim data yang diperbarui ke API
      await apiClient.put(`/topics/${topic.id}`, { title });
      toast.success('Topik berhasil diperbarui.', { id: loadingToast });
      onTopicUpdated(); // Memuat ulang data di halaman utama
      onClose(); // Menutup modal
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengupdate topik.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Topik">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="topic-title-edit" className="block text-sm font-medium">Judul Topik</label>
          <input
            type="text"
            id="topic-title-edit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}