// Path: client/components/dashboard/AddActivityModal.tsx
'use client';

import Modal from '@/components/ui/Modal';
import { FaFileUpload, FaClipboardList, FaClock } from 'react-icons/fa';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: () => void;
  onSelectAssignment: () => void;
  onSelectAttendance: () => void;
}

export default function AddActivityModal({
  isOpen,
  onClose,
  onSelectMaterial,
  onSelectAssignment,
  onSelectAttendance,
}: AddActivityModalProps) {
  // Langsung return komponen Modal tanpa div pembungkus tambahan
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Pilih Aktivitas atau Sumber Daya"
      isFullScreen={true} // Tambahkan prop ini untuk mengontrol mode fullscreen
    >
      {/* Konten di dalam modal dibuat terpusat di tengah layar */}
      <div className="flex items-center justify-center h-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center p-8">
          
          {/* Tombol Tambah Materi */}
          <button
            onClick={() => {
              onSelectMaterial();
              onClose(); // Menutup modal setelah diklik
            }}
            className="p-8 border bg-white rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <FaFileUpload className="text-5xl text-blue-500 mb-4" />
            <span className="font-semibold text-lg text-gray-800">Materi File</span>
            <p className="text-sm text-gray-500 mt-1">Unggah dokumen, PDF, atau video.</p>
          </button>

          {/* Tombol Tambah Tugas */}
          <button
            onClick={() => {
              onSelectAssignment();
              onClose(); // Menutup modal setelah diklik
            }}
            className="p-8 border bg-white rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <FaClipboardList className="text-5xl text-green-500 mb-4" />
            <span className="font-semibold text-lg text-gray-800">Tugas / Kuis</span>
            <p className="text-sm text-gray-500 mt-1">Buat tugas dengan batas waktu.</p>
          </button>

          {/* Tombol Tambah Absensi */}
          <button
            onClick={() => {
              onSelectAttendance();
              onClose(); // Menutup modal setelah diklik
            }}
            className="p-8 border bg-white rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <FaClock className="text-5xl text-red-500 mb-4" />
            <span className="font-semibold text-lg text-gray-800">Absensi</span>
            <p className="text-sm text-gray-500 mt-1">Buat sesi absensi untuk kelas.</p>
          </button>

        </div>
      </div>
    </Modal>
  );
}