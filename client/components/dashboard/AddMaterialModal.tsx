// Path: client/components/dashboard/AddMaterialModal.tsx
'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import classContentApiClient from '@/lib/axiosClassContent';
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

  // Reset semua state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setYoutubeUrl('');
      setFile(null);
      setIsLoading(false);
      // Reset file input value
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !topicId) {
      toast.error('Judul materi wajib diisi.');
      return;
    }
    if (!content && !youtubeUrl && !file) {
      toast.error('Harap isi konten, link YouTube, atau unggah file.');
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Menyimpan materi...');

    try {
      if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('youtubeUrl', youtubeUrl);
        formData.append('file', file);

        await classContentApiClient.post(`/materials/topics/${topicId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = { title, content, youtubeUrl };
        await classContentApiClient.post(`/materials/topics/${topicId}`, payload);
      }
      
      toast.success('Materi berhasil ditambahkan!', { id: toastId });
      onMaterialAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan materi.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Tambah Aktivitas: Materi Baru"
      isFullScreen={true} // <-- Kunci untuk membuatnya fullscreen
    >
      {/* Wrapper untuk memusatkan form di layar */}
      <div className="flex justify-center items-start h-full p-4 sm:p-8 overflow-y-auto">
        <form 
          onSubmit={handleSubmit} 
          className="space-y-6 bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl"
        >
          {/* Judul Materi */}
          <div>
            <label htmlFor="material-title" className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
            <input
              type="text" id="material-title" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="mt-1 block w-full px-4 py-2 border border-gray-300  text-gray-500 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Pengenalan Aljabar"
            />
          </div>
          
          {/* Konten Teks */}
          <div>
            <label htmlFor="material-content" className="block text-sm font-medium text-gray-700 mb-1">Konten Teks (Opsional)</label>
            <textarea
              id="material-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 text-gray-500 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ketik deskripsi atau materi singkat di sini..."
            />
          </div>

          {/* Link YouTube */}
          <div>
            <label htmlFor="material-youtube" className="block text-sm font-medium text-gray-700 mb-1">Link Video YouTube (Opsional)</label>
            <input
              type="url" id="material-youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300  text-gray-500 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* Unggah File */}
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
          
          {/* Tombol Aksi */}
          <div className="flex justify-end gap-4 pt-4 border-t mt-8">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors">Batal</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors">
              {isLoading ? 'Menyimpan...' : 'Simpan Materi'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}