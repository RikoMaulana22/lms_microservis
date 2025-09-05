export type AssignmentType = 'pilgan' | 'esai' | 'upload_gambar' | 'link_google';
export type UserRole = 'siswa' | 'guru' | 'admin' | 'wali_kelas';
export interface User {
    id: number;
    fullName: string;
    username: string;
    role: UserRole;
    email: string;
    createdAt?: string;
    nisn?: string | null;
    homeroomClassId?: number;
}
export interface Teacher {
    id: number;
    fullName: string;
}
export interface Settings {
    schoolName?: string;
}
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
    teacher: Teacher;
    homeroomTeacher?: Teacher;
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
export interface AssignmentInfo {
    id: number;
    title: string;
    type: AssignmentType;
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
export interface ClassDetails {
    id: number;
    name: string;
    isEnrolled: boolean;
    teacherId: number;
    topics: TopicInfo[];
}
export interface Submission {
    id: number;
    submissionDate: string;
    score: number | null;
    essayAnswer?: string | null;
    student: {
        fullName: string;
    };
    selectedOptions?: Record<number, number>;
}
export interface Announcement {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    author: {
        fullName: string;
    };
}
export type GroupedSubjects = Record<string, Subject[]>;
