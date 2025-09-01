// types.ts

// ---------------- ENUMS / TYPES ----------------
export type AssignmentType = 'pilgan' | 'esai' | 'upload_gambar' | 'link_google';
export type UserRole = 'siswa' | 'guru' | 'admin' | 'wali_kelas';

// ---------------- USER ----------------
export interface User {
  id: number;
  fullName: string;
  username: string; // sekarang sudah ada
  role: UserRole;
  email: string;
  createdAt?: string;
  nisn?: string | null;        // opsional
  homeroomClassId?: number;    // opsional
}

export interface Teacher { 
  id: number; 
  fullName: string; 
}

// ---------------- SETTINGS ----------------
export interface Settings {
  schoolName?: string;
  // bisa ditambah: academicYear?, appLogo?, dsb.
}

// ---------------- CLASS & SUBJECT ----------------
export interface Subject {
  id: number;
  name: string;
  grade: number;
  Class: ClassInfo[]; 
}

export interface ClassInfo {
  id: number;
  name: string;
  description?: string;
  subject: Subject;
  teacher: Teacher;             // pengajar utama
  homeroomTeacher?: Teacher;    // wali kelas opsional
  _count?: {
    members?: number;
  };
}

export interface ClassSummary {
  id: number;
  name: string;
  description: string | null;
  imageUrl?: string | null; 
  subject: {
    name: string;
  };
  Teacher: {
    fullName: string;
    id: number;
  };
  _count: {
    members: number;
  };
}

// ---------------- MATERIAL & TOPIC ----------------
export interface MaterialInfo {
  id: number;
  title: string;
  fileUrl?: string | null;    
  youtubeUrl?: string | null; 
  content?: string | null;    
}

export interface TopicInfo {
  id: number;
  title: string;
  order: number;
  materials: MaterialInfo[];
  assignments: AssignmentInfo[];
}

export interface GlobalMaterial {
  id: number;
  title: string;
  fileUrl: string;
}

// ---------------- ASSIGNMENT ----------------
export interface AssignmentInfo {
  id: number;
  title: string;
  type: AssignmentType;   // gunakan AssignmentType bukan string
  dueDate: string;
}

export interface AssignmentDetails {
  id: number;
  title: string;
  description: string;
  type: AssignmentType;
  dueDate: string;
  externalUrl?: string | null;
}

// ---------------- CLASS DETAILS ----------------
export interface ClassDetails {
  id: number;
  name: string;
  isEnrolled: boolean;
  teacherId: number;
  topics: TopicInfo[];
}

// ---------------- SUBMISSION ----------------
export interface Submission {
  id: number;
  submissionDate: string;
  score: number | null;
  essayAnswer?: string | null; 
  student: { fullName: string };
  selectedOptions?: Record<number, number>; // untuk pilihan ganda
}

// ---------------- ANNOUNCEMENT ----------------
export interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    fullName: string;
  };
}

// ---------------- EXPRESS ----------------
// Jangan override Request lagi di sini, karena sudah di-augmentasi global
// Kalau perlu cast, cukup pakai Express.Request atau (req as Express.Request & { user?: ... })

// ---------------- UTILS ----------------
export type GroupedSubjects = Record<string, Subject[]>;
