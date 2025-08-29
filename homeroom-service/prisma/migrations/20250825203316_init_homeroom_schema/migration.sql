/*
  Warnings:

  - You are about to drop the column `date` on the `StudentNote` table. All the data in the column will be lost.
  - You are about to drop the `Letter` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "StudentNote" DROP COLUMN "date",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Letter";

-- DropEnum
DROP TYPE "LetterType";

-- DropEnum
DROP TYPE "NoteType";
