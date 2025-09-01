// client/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { User } from '@/types';
import Link from 'next/link';
import adminApiClient from '@/lib/axiosAdmin';
import toast from 'react-hot-toast';
import AddUserModal from '@/components/dashboard/admin/AddUserModal';
import EditUserModal from '@/components/dashboard/admin/EditUserModal';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    // ✅ PERBAIKAN: Tambahkan 'wali_kelas' ke tipe filter
    const [filterRole, setFilterRole] = useState<'semua' | 'guru' | 'siswa' | 'wali_kelas'>('semua');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            // ✅ PERBAIKAN: Endpoint yang benar adalah '/users', bukan '/admin/users'
            const response = await adminApiClient.get('/users', {
                params: filterRole !== 'semua' ? { role: filterRole } : {}
            });
            setUsers(response.data);
        } catch (error) {
            toast.error("Gagal mengambil data pengguna.");
            console.error("Gagal mengambil data pengguna:", error);
        } finally {
            setIsLoading(false);
        }
    }, [filterRole]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

        const toastId = toast.loading('Menghapus pengguna...');
        try {
            await adminApiClient.delete(`/users/${userId}`);
            toast.success('Pengguna berhasil dihapus.', { id: toastId });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menghapus pengguna.', { id: toastId });
        }
    };

    return (
        <>
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={fetchUsers}
            />
            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={selectedUser}
                onUserUpdated={fetchUsers}
            />
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                    {/* ✅ PERBAIKAN: Bungkus tombol dalam div untuk layout yang lebih baik */}
                    <div className="flex items-center gap-4">
                        <select 
                            value={filterRole} 
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterRole(e.target.value as any)}
                            className="p-2 border rounded-md"
                        >
                            <option value="semua">Semua Peran</option>
                            <option value="siswa">Siswa</option>
                            <option value="guru">Guru</option>
                            <option value="wali_kelas">Wali Kelas</option>
                        </select>
                        <Link href="/admin/users/import" className="btn-secondary whitespace-nowrap">
                            Impor Massal
                        </Link>
                        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">+ Tambah Pengguna</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nama Lengkap</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Peran</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-4">Memuat pengguna...</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                    {/* ✅ PERBAIKAN: Format peran 'wali_kelas' menjadi 'Wali Kelas' */}
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role.replace('_', ' ')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}