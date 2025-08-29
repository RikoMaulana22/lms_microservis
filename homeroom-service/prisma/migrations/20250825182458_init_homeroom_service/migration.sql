-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('PELANGGARAN', 'PRESTASI', 'BIMBINGAN_KONSELING', 'CATATAN_ORANG_TUA');

-- CreateEnum
CREATE TYPE "LetterType" AS ENUM ('IZIN_SAKIT', 'IZIN_ACARA', 'PANGGILAN_ORANG_TUA');

-- CreateTable
CREATE TABLE "StudentNote" (
    "id" SERIAL NOT NULL,
    "type" "NoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" SERIAL NOT NULL,
    "type" "LetterType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "studentId" INTEGER,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);
