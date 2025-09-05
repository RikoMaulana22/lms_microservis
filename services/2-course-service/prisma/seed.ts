import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- PERBAIKAN: Urutan penghapusan data disesuaikan dengan relasi ---
  
  // 1. Hapus model yang paling banyak menjadi turunan
  await prisma.material.deleteMany({});
  await prisma.class_Members.deleteMany({});
  
  // 2. Hapus model yang menjadi parent dari model di atas
  await prisma.topic.deleteMany({});
  
  // 3. Hapus Class, yang merupakan parent dari Topic dan Class_Members
  await prisma.class.deleteMany({});
  console.log('Deleted old classes, topics, materials, and members.');

  // 4. Terakhir, hapus Subject yang merupakan parent dari Class
  await prisma.subject.deleteMany({});
  console.log('Deleted old subjects.');
  
  // DIHAPUS: Baris untuk `assignment` karena modelnya tidak ada di schema.prisma

  // --- Kode untuk membuat data baru ---
  const subjectsToCreate = [];
  const grades = [7, 8, 9];
  const subjectNames = [
    'Pendidikan Agama dan Budi Pekerti',
    'PPKn (Pendidikan Pancasila dan Kewarganegaraan)',
    'Bahasa Indonesia',
    'Matematika',
    'IPA (Ilmu Pengetahuan Alam)',
    'IPS (Ilmu Pengetahuan Sosial)',
    'Bahasa Inggris',
    'Seni Budaya',
    'PJOK (Pendidikan Jasmani dan Kesehatan)',
    'Informatika / TIK',
    'Prakarya dan Kewirausahaan'
  ];

  // Buat data untuk setiap mata pelajaran di setiap tingkatan kelas
  for (const grade of grades) {
    for (const name of subjectNames) {
      subjectsToCreate.push({ name, grade });
    }
  }

  // PERBAIKAN: Menggunakan nama model yang benar (`subject`)
  await prisma.subject.createMany({
    data: subjectsToCreate,
  });

  console.log(`Seeding finished. Created ${subjectsToCreate.length} subjects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });