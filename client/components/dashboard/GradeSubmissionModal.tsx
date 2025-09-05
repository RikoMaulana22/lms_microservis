'use client';

import { useState, FormEvent, useEffect } from 'react';
import apiClient from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// Definisikan tipe data untuk Submission
interface Submission {
  id: string | number;
  score?: number | null;
  student: {
    fullName: string;
  };
  essayAnswer?: string | null;
}

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  onGradeSuccess: () => void;
}

export default function GradeSubmissionModal({ isOpen, onClose, submission, onGradeSuccess }: GradeSubmissionModalProps) {
  const [score, setScore] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Mengisi form dengan nilai yang ada saat modal dibuka
  useEffect(() => {
    if (submission) {
      setScore(submission.score?.toString() || '');
    }
  }, [submission]);

  // Fungsi untuk menangani submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Mencegah halaman refresh
    if (!submission) return;

    // Konversi nilai dari string ke angka
    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        toast.error('Nilai harus di antara 0 dan 100.');
        return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Menyimpan nilai...');

    try {
      // Mengirim data nilai ke API
      await apiClient.put(`/submissions/${submission.id}/grade`, {
        score: numericScore
      });
      toast.success('Nilai berhasil disimpan!', { id: loadingToast });
      onGradeSuccess(); // Memuat ulang data di halaman utama
      onClose(); // Menutup modal
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan nilai.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="text-gray-800">
      <Modal isOpen={isOpen} onClose={onClose} title={`Beri Nilai untuk ${submission?.student.fullName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {submission?.essayAnswer && (
            <div>
              <label className="block text-sm font-bold text-gray-800">Jawaban Siswa</label>
              <div className="mt-2 p-3 bg-gray-50 border rounded-md max-h-48 overflow-y-auto text-gray-700 whitespace-pre-wrap">
                  {submission.essayAnswer}
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="score" className="block text-sm font-medium text-gray-700">Nilai (0-100)</label>
            <input
              type="number"
              id="score"
              name="score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
              min="0"
              max="100"
              step="0.1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Masukkan nilai"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}