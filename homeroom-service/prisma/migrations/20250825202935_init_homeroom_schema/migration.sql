/*
  Warnings:

  - The `type` column on the `StudentNote` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "StudentNote" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'BIMBINGAN_KONSELING';

-- CreateTable
CREATE TABLE "HomeroomStudent" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "homeroomId" INTEGER NOT NULL,

    CONSTRAINT "HomeroomStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeroom" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "Homeroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeroomStudent_studentId_homeroomId_key" ON "HomeroomStudent"("studentId", "homeroomId");

-- CreateIndex
CREATE UNIQUE INDEX "Homeroom_teacherId_key" ON "Homeroom"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Homeroom_classId_key" ON "Homeroom"("classId");

-- AddForeignKey
ALTER TABLE "HomeroomStudent" ADD CONSTRAINT "HomeroomStudent_homeroomId_fkey" FOREIGN KEY ("homeroomId") REFERENCES "Homeroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
