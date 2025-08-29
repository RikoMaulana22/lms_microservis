/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_teacherId_fkey";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";
