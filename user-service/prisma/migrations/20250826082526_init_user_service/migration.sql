-- DropIndex
DROP INDEX "User_nisn_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "homeroomClassId" INTEGER,
ALTER COLUMN "role" SET DEFAULT 'siswa';
