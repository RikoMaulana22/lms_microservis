// Ini adalah file CreateClassModal.tsx Anda yang sudah diperbarui

'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import adminApiClient from '@/lib/axiosAdmin';
import classContentApiClient from '@/lib/axiosClassContent';
import { Subject, User } from '@/types';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

export default function CreateClassModal({ isOpen, onClose, onClassCreated }: CreateClassModalProps) {
  // ... semua state Anda tetap sama ...
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [teacherId, setTeacherId] = useState('');

  // ... semua hooks (useEffect, useMemo) dan functions (handleSubmit, dll.) tetap sama ...
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSelectedGrade('');
      setSubjectId('');
      setError(null);
      setImageFile(null);
      setImagePreview(null);
      setTeacherId('');

      const fetchPrerequisites = async () => {
        try {
          const [subjectsRes, teachersRes] = await Promise.all([
            classContentApiClient.get('../subjects'), // Ambil mapel dari class-content-service
            adminApiClient.get('/teachers') // Ambil guru dari admin-service
          ]);
          setAllSubjects(subjectsRes.data);
          setTeachers(teachersRes.data);
        } catch (error) {
          setError('Gagal memuat data form.');
        }
      };
      fetchPrerequisites();
    }
  }, [isOpen]);

  const filteredSubjects = useMemo(() => {
    if (!selectedGrade) return [];
    return allSubjects.filter(subject => subject.grade === parseInt(selectedGrade, 10));
  }, [selectedGrade, allSubjects]);

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setSubjectId('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const toastId = toast.loading('Menyimpan kelas...');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('subjectId', subjectId);
    formData.append('teacherId', teacherId);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
       await classContentApiClient.post('/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Kelas berhasil dibuat!', { id: toastId });
      onClassCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat kelas.', { id: toastId });
      setError(err.response?.data?.message || 'Gagal membuat kelas.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    
    // ✅ PERUBAHAN 1: Tambahkan prop size="fullscreen"
    <Modal isOpen={isOpen} onClose={onClose} title="BUAT KELAS BARU" isFullScreen>
      {/* ✅ PERUBAHAN 2: Tambahkan div wrapper untuk membatasi lebar form agar rapi */}
      <div className="max-w-2xl mx-auto mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          {/* ... semua elemen form Anda di sini ... */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-bold text-gray-700  ">Nama Kelas</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Contoh: Matematika Kelas 7A" />
          </div>
          <div className="mb-4">
            <label htmlFor="grade" className="block text-sm font-bold text-gray-700">Tingkat Kelas</label>
            <select id="grade" value={selectedGrade} onChange={handleGradeChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="" disabled>Pilih Tingkatan Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-bold text-gray-700">Mata Pelajaran</label>
            <select id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required disabled={!selectedGrade} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
              <option value="" disabled>Pilih Mata Pelajaran</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="teacher" className="block text-sm font-bold text-gray-700">Guru Pengajar</label>
            <select id="teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="" disabled>Pilih Guru Pengajar</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-bold text-gray-700">Deskripsi (Opsional)</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700">Gambar Sampul Kelas (Opsional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Pratinjau Gambar" className="mx-auto h-24 w-auto rounded-md" />
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500">
                    <span>Unggah file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </label>
                  <p className="pl-1">atau tarik dan lepas</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 2MB</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
    
  );
}