'use client';

import { useState, FormEvent, useEffect } from 'react';
import apiClient from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { FaBook, FaTrash } from 'react-icons/fa';
import QuestionBankSelector from './QuestionBankSelector';

// Definisikan tipe data yang relevan
interface Question {
  id: number;
  questionText: string;
  type: 'pilgan' | 'esai';
  topic: string;
}

interface AssignmentState {
  title: string;
  description: string;
  dueDate: string;
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

  const handleSelectQuestions = (questions: Question[]) => {
    setAssignment(prev => ({ ...prev, selectedQuestions: questions }));
    setIsQuestionBankOpen(false);
  };

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

    const payload = {
      title: assignment.title,
      description: assignment.description,
      dueDate: new Date(assignment.dueDate).toISOString(),
      questionIds: assignment.selectedQuestions.map(q => q.id),
    };

    try {
      // ✅ PERBAIKAN: Hapus duplikasi path '/assignments'
      await apiClient.post(`/topic/${topicId}/from-bank`, payload);
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
      {/* --- PERBAIKAN DI SINI: Tambahkan prop size='fullscreen' --- */}
      <Modal isOpen={isOpen} onClose={onClose} title="Buat Tugas / Kuis Baru dari Bank Soal" isFullScreen>
        {/* --- PERBAIKAN DI SINI: Ubah struktur form untuk layout fullscreen --- */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-gray-50 text-gray-800">
          {/* Konten Form (Bagian Atas) */}
          <div className="flex-grow p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Kolom Kiri: Detail Tugas */}
              <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-xl border-b pb-2">Detail Tugas</h3>
                <div>
                  <label className="block text-sm font-medium">Judul</label>
                  <input type="text" name="title" value={assignment.title} onChange={handleChange} required className="form-input border w-full mt-1 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Deskripsi</label>
                  <textarea name="description" value={assignment.description} onChange={handleChange} rows={5} className="form-textarea border w-full mt-1 rounded-md"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium">Tanggal Tenggat</label>
                  <input type="datetime-local" name="dueDate" value={assignment.dueDate} onChange={handleChange} required className="form-input mt-1 w-full rounded-md" />
                </div>
              </div>

              {/* Kolom Kanan: Daftar Soal */}
              <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-semibold text-xl">Daftar Soal</h3>
                  <button
                    type="button"
                    onClick={() => setIsQuestionBankOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                  >
                    <FaBook />
                    Pilih dari Bank Soal
                  </button>
                </div>

                <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto">
                  {assignment.selectedQuestions.length > 0 ? (
                    assignment.selectedQuestions.map((q) => (
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
                    <div className="text-center text-gray-500 py-10">
                      <p>Belum ada soal yang dipilih.</p>
                      <p className="text-sm">Klik tombol "Pilih dari Bank Soal" untuk memulai.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Aksi (Bagian Bawah) */}
          <div className="flex-shrink-0 flex justify-end gap-4 p-4 bg-white border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Menyimpan...' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal untuk Bank Soal (tidak diubah) */}
      <QuestionBankSelector
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        onSelect={handleSelectQuestions}
        previouslySelected={assignment.selectedQuestions}
      />
    </>
  );
}