'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';

// PERBAIKAN: Impor tipe data dari shared/types untuk konsistensi

export interface GlobalMaterial {
  id: number;
  title: string;
  fileUrl: string;
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

// Definisikan tipe untuk jadwal karena belum ada di shared/types
type ScheduleItem = { 
    id: string | number; 
    className: string; 
    startTime: string; 
    endTime: string;
};
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

export interface Teacher { 
  id: number; 
  fullName: string; 
}
export interface Subject {
  id: number;
  name: string;
  grade: number;
  Class: ClassInfo[]; 
}

export type GroupedSubjects = Record<string, Subject[]>;

async function fetchAllData(): Promise<{
  myClasses: ClassSummary[];
  groupedSubjects: GroupedSubjects;
  announcements: Announcement[];
  globalMaterials: GlobalMaterial[];
  schedules: ScheduleItem[];
}> {
  try {
    const [
      myClassesResponse,
      groupedSubjectsResponse,
      announcementsResponse,
      globalMaterialsResponse,
      schedulesResponse
    ] = await Promise.all([
      apiClient.get(`/classes/student`),
      apiClient.get(`/subjects/grouped`),
      apiClient.get(`/announcements`),
      apiClient.get(`/materials/global`),
      apiClient.get(`/schedules/my`),
    ]);

    return {
      myClasses: myClassesResponse.data,
      groupedSubjects: groupedSubjectsResponse.data,
      announcements: announcementsResponse.data,
      globalMaterials: globalMaterialsResponse.data,
      schedules: schedulesResponse.data,
    };
  } catch (error) {
    console.error('Failed to fetch all dashboard data:', error);
    throw error;
  }
}

// duplicate placeholder removed because the async fetchAllData implementation is defined above
