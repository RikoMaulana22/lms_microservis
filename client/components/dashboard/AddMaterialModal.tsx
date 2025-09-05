// Path: client/components/dashboard/AddMaterialModal.tsx
'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
// ✅ BENAR: API client ini sudah benar
import apiClient from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: number | null;
  onMaterialAdded: () => void;
}

export default function AddMaterialModal({ isOpen, onClose, topicId, onMaterialAdded }: AddMaterialModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setYoutubeUrl('');
      setFile(null);
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topicId || !title) {
      toast.error('Judul materi wajib diisi.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Mengunggah materi...');

    // Menggunakan FormData karena kita mengirim file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('youtubeUrl', youtubeUrl);
    formData.append('topicId', topicId.toString());
    if (file) {
      formData.append('file', file);
    }

    try {
      // ✅ PERBAIKAN: Endpoint harus menunjuk ke rute materi
      // baseURL adalah '/api/classes', jadi kita butuh path relatif
      await apiClient.post('../materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Materi berhasil ditambahkan!', { id: toastId });
      onMaterialAdded();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan materi.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Materi Baru">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="material-title" className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
          <input
            type="text" id="material-title" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="form-input w-full mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Contoh: Pengenalan Aljabar"
          />
        </div>
        <div>
          <label htmlFor="material-content" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Teks Materi (Opsional)</label>
          <textarea
            id="material-content" value={content} onChange={(e) => setContent(e.target.value)} rows={5}
            className="form-textarea w-full mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jelaskan isi materi di sini..."
          />
        </div>
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">Link YouTube (Opsional)</label>
          <input
            type="url" id="youtube-url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
            className="form-input w-full mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div>
          <label htmlFor="material-file" className="block text-sm font-medium text-gray-700 mb-1">Unggah File (Opsional)</label>
          <input
            type="file" id="material-file" ref={fileInputRef} onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {file && (
            <p className="text-xs text-gray-500 mt-2">File dipilih: {file.name}</p>
          )}
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t mt-8">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Menyimpan...' : 'Simpan Materi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}