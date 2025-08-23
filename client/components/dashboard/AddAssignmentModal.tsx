// client/components/dashboard/AddAssignmentModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import assignmentApiClient from '@/lib/axiosAssignment';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaBook } from 'react-icons/fa';
import QuestionBankSelector from './QuestionBankSelector'; // Komponen baru untuk memilih soal

// Tipe data yang akan kita gunakan
interface Question {
  id: number;
  questionText: string;
  type: 'pilgan' | 'esai';
  topic: string; // Contoh metadata
}

interface AssignmentState {
  title: string;
  description: string;
  dueDate: string;
  // Soal yang DIPILIH untuk tugas ini, bukan dibuat di sini
  selectedQuestions: Question[];
}

const initialAssignmentState: AssignmentState = {
  title: '',
  description: '',
  dueDate: '',
  selectedQuestions: [],
};

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: number | null;
  onAssignmentAdded: () => void;
}

export default function AddAssignmentModal({ isOpen, onClose, topicId, onAssignmentAdded }: AddAssignmentModalProps) {
  const [assignment, setAssignment] = useState<AssignmentState>(initialAssignmentState);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk mengontrol tampilan modal Bank Soal
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAssignment(initialAssignmentState);
      setIsQuestionBankOpen(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAssignment(prev => ({ ...prev, [name]: value }));
  };
  
  // Fungsi untuk menangani soal yang dipilih dari bank soal
  const handleSelectQuestions = (questions: Question[]) => {
    setAssignment(prev => ({ ...prev, selectedQuestions: questions }));
    setIsQuestionBankOpen(false); // Tutup modal bank soal setelah memilih
  };
  
  // Fungsi untuk menghapus soal yang sudah dipilih dari tugas
  const removeSelectedQuestion = (questionId: number) => {
    setAssignment(prev => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.filter(q => q.id !== questionId)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topicId || !assignment.title || !assignment.dueDate) {
      toast.error('Judul dan tanggal tenggat wajib diisi.');
      return;
    }
    if (assignment.selectedQuestions.length === 0) {
      toast.error('Pilih setidaknya satu soal dari Bank Soal.');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Menyimpan tugas...');

    // Payload hanya berisi ID dari soal-soal yang dipilih
    const payload = {
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      questionIds: assignment.selectedQuestions.map(q => q.id), // Kirim array of IDs
    };

    try {
      // Endpoint API perlu disesuaikan di backend nanti
      await assignmentApiClient.post(`/assignments/topic/${topicId}/from-bank`, payload);
      toast.success('Tugas berhasil dibuat!', { id: loadingToast });
      onAssignmentAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat tugas.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Buat Tugas / Kuis Baru dari Bank Soal">
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto text-gray-800 p-1">
          {/* Detail Tugas Utama */}
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <h3 className="font-semibold text-lg">Detail Tugas</h3>
            <div>
              <label className="block text-sm font-medium">Judul</label>
              <input type="text" name="title" value={assignment.title} onChange={handleChange} required className="form-input border w-full mt-1 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium">Deskripsi</label>
              <textarea name="description" value={assignment.description} onChange={handleChange} rows={3} className="form-textarea border w-full mt-1 rounded-md"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium">Tanggal Tenggat</label>
              <input type="datetime-local" name="dueDate" value={assignment.dueDate} onChange={handleChange} required className="form-input mt-1 w-full rounded-md" />
            </div>
          </div>

          {/* Bagian Bank Soal */}
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Daftar Soal</h3>
                <button
                    type="button"
                    onClick={() => setIsQuestionBankOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                    <FaBook />
                    Pilih dari Bank Soal
                </button>
            </div>

            {/* Daftar soal yang sudah dipilih */}
            <div className="space-y-2 mt-4">
              {assignment.selectedQuestions.length > 0 ? (
                assignment.selectedQuestions.map((q, index) => (
                  <div key={q.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                    <div className="text-sm">
                      <span className="font-bold">[{q.type.toUpperCase()}]</span> {q.questionText.substring(0, 80)}...
                    </div>
                    <button type="button" onClick={() => removeSelectedQuestion(q.id)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Belum ada soal yang dipilih. Klik tombol "Pilih dari Bank Soal".</p>
              )}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-blue-300 hover:bg-blue-700">
              {isLoading ? 'Menyimpan...' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal untuk Bank Soal */}
      <QuestionBankSelector
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        onSelect={handleSelectQuestions}
        previouslySelected={assignment.selectedQuestions}
      />
    </>
  );
}