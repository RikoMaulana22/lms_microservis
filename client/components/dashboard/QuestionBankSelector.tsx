// client/components/dashboard/QuestionBankSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { FaSearch, FaPlus } from 'react-icons/fa';
import assignmentApiClient from '@/lib/axiosAssignment'; // Pastikan ini diimpor
import toast from 'react-hot-toast'; // Impor toast untuk notifikasi error

// Tipe data Question (harus sama dengan di AddAssignmentModal)
interface Question {
  id: number;
  questionText: string;
  type: 'pilgan' | 'esai';
  topic: string;
}

interface QuestionBankSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedQuestions: Question[]) => void;
  previouslySelected: Question[];
}

export default function QuestionBankSelector({ isOpen, onClose, onSelect, previouslySelected }: QuestionBankSelectorProps) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fungsi untuk mengambil data dari API
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        // --- PERUBAHAN UTAMA: Panggil API di sini ---
        const response = await assignmentApiClient.get('/question-bank');
        setAllQuestions(response.data);
        // ------------------------------------------
      } catch (error) {
        console.error("Gagal mengambil data bank soal:", error);
        toast.error("Tidak dapat memuat soal dari bank soal. Coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    // Inisialisasi soal yang sudah dipilih sebelumnya
    const initialIds = new Set(previouslySelected.map(q => q.id));
    setSelectedIds(initialIds);

    // Panggil fungsi fetch data hanya saat modal terbuka
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, previouslySelected]);

  const handleToggleSelection = (questionId: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedIds(newSelection);
  };

  const handleConfirmSelection = () => {
    const selectedQuestions = allQuestions.filter(q => selectedIds.has(q.id));
    onSelect(selectedQuestions);
  };
  
  // Filter soal berdasarkan pencarian
  const filteredQuestions = allQuestions.filter(q => 
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pilih Soal dari Bank Soal" isFullScreen>
       <div className="flex flex-col h-full bg-gray-50 p-4">
        {/* Header: Search, Filter, dan Tombol Tambah Soal Baru */}
        <div className="flex-shrink-0 flex gap-4 items-center mb-4 p-4 bg-white rounded-lg border">
          <div className="relative flex-grow">
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Cari soal berdasarkan teks atau topik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 text-gray-500 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-100">Filter</button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
          >
            <FaPlus />
            Soal Baru
          </button>
        </div>

        {/* Konten: Daftar Soal */}
        <div className="flex-grow overflow-y-auto bg-white rounded-lg border p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <p>Memuat soal...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map(q => (
                    <div 
                    key={q.id} 
                    className={`flex items-center gap-4 p-3 rounded-md border cursor-pointer ${selectedIds.has(q.id) ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}
                    onClick={() => handleToggleSelection(q.id)}
                    >
                    <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        readOnly
                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-grow">
                        <p className="font-semibold">{q.questionText}</p>
                        <p className="text-xs text-gray-500">
                        <span className="font-bold">Topik:</span> {q.topic} | <span className="font-bold">Tipe:</span> {q.type}
                        </p>
                    </div>
                    </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Tidak ada soal yang ditemukan.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Tombol Aksi */}
        <div className="flex-shrink-0 flex justify-between items-center mt-4 pt-4 border-t">
          <p className="font-semibold">{selectedIds.size} soal dipilih</p>
          <div>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-500 mr-4">Batal</button>
            <button onClick={handleConfirmSelection} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Tambahkan Soal
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}