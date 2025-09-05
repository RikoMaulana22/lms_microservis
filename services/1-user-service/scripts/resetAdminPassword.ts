import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // --- GANTI DETAIL DI BAWAH INI ---// npx ts-node scripts/resetAdminPassword.ts

    const usernameToUpdate = "admin"; // Ganti dengan username yang mau direset atau dibuat
    const newPassword = "admin123"; // Atur password baru yang Anda inginkan
    // ------------------------------------

    console.log(`Memproses pengguna: ${usernameToUpdate}...`);

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update pengguna di database, atau buat jika tidak ada
    const user = await prisma.user.upsert({
        where: {
            username: usernameToUpdate,
        },
        update: {
            password: hashedPassword,
        },
        create: {
            username: usernameToUpdate,
            password: hashedPassword,
            fullName: 'Admin', // Menggunakan fullName sesuai schema.prisma
            email: 'admin@example.com', // Tambahkan email default (pastikan unik)
            role: Role.admin, // Sesuaikan dengan enum 'admin'
        },
    });

    console.log(`\n[SUCCESS] Password untuk pengguna '${user.username}' telah berhasil direset/dibuat.`);
    console.log(`--> Anda sekarang bisa login dengan password: ${newPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });