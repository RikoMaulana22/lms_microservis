// Path: client/app/(dashboard)/dashboard/page.tsx
'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            // ✅ PERBAIKAN: Arahkan ke halaman login jika pengguna tidak terautentikasi
            router.push('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) { // ✅ PERBAIKAN: Tampilkan loading jika user juga belum ada
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    // Tampilkan komponen dashboard yang sesuai berdasarkan role
    if (user.role === 'guru' || user.role === 'wali_kelas') { // Wali kelas juga menggunakan dashboard guru
        return <TeacherDashboard user={user} />;
    }
    
    if (user.role === 'siswa') {
        return <StudentDashboard user={user} />;
    }

    // Redirect jika role tidak sesuai (misal: admin mencoba akses)
    // useEffect di atas akan menangani kasus belum login
    useEffect(() => {
        if (!isLoading && user && !['guru', 'wali_kelas', 'siswa'].includes(user.role)) {
            toast.error("Halaman tidak tersedia untuk peran Anda.");
            router.push('/'); // Arahkan ke halaman utama
        }
    }, [isLoading, user, router]);


    return null; // Tampilkan null selama proses redirect
}