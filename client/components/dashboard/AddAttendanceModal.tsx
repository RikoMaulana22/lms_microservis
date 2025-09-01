// Path: client/components/dashboard/AddAttendanceModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
// ✅ BENAR: API client ini sudah benar
import attendanceApiClient from '@/lib/axiosAttendance';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface AddAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: number | null;
  onAttendanceAdded: () => void;
}

export default function AddAttendanceModal({ isOpen, onClose, topicId, onAttendanceAdded }: AddAttendanceModalProps) {
  const [title, setTitle] = useState('Absensi Pertemuan');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setTitle('Absensi Pertemuan');
    setOpenTime('');
    setCloseTime('');
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topicId) {
      toast.error("ID Topik tidak valid.");
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Membuat sesi absensi...');
    try {
      const payload = {
        title,
        topicId,
        openTime: new Date(openTime).toISOString(),
        closeTime: new Date(closeTime).toISOString(),
      };
      // ✅ PERBAIKAN: Endpoint untuk membuat absensi adalah '/', bukan path yang lebih panjang
      await attendanceApiClient.post('/', payload);
      toast.success('Sesi absensi berhasil dibuat!', { id: toastId });
      onAttendanceAdded();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat absensi.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Atur Sesi Kehadiran">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Judul Absensi</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-input w-full mt-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Waktu Dibuka</label>
            <input type="datetime-local" value={openTime} onChange={(e) => setOpenTime(e.target.value)} required className="form-input w-full mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Waktu Ditutup</label>
            <input type="datetime-local" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} required className="form-input w-full mt-1" />
          </div>
        </div>
        <p className="text-xs text-gray-500">Siswa hanya bisa mengisi absensi di antara waktu dibuka dan ditutup.</p>
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={handleClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Menyimpan...' : 'Simpan Sesi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}