// class-content-service/prisma/seed.ts

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Hapus data dalam urutan yang benar untuk menghindari error foreign key
  await prisma.class_Members.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.class.deleteMany({});
  console.log('Deleted old classes and related data.');

  await prisma.subject.deleteMany({});
  console.log('Deleted old subjects.');

  // Berikan tipe eksplisit untuk array
  const subjectsToCreate: Prisma.SubjectCreateInput[] = [];
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