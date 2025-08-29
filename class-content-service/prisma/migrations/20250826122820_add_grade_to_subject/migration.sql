/*
  Warnings:

  - The primary key for the `Class` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `grade` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `studentIds` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Class` table. All the data in the column will be lost.
  - The `id` column on the `Class` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `homeroomTeacherId` column on the `Class` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Material` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Material` table. All the data in the column will be lost.
  - The `id` column on the `Material` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `topicId` column on the `Material` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Subject` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `teacherIds` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Subject` table. All the data in the column will be lost.
  - The `id` column on the `Subject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Topic` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Topic` table. All the data in the column will be lost.
  - The `id` column on the `Topic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_ClassToSubject` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subjectId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Topic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Topic` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Topic" DROP CONSTRAINT "Topic_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ClassToSubject" DROP CONSTRAINT "_ClassToSubject_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ClassToSubject" DROP CONSTRAINT "_ClassToSubject_B_fkey";

-- DropIndex
DROP INDEX "public"."Class_homeroomTeacherId_key";

-- AlterTable
ALTER TABLE "public"."Class" DROP CONSTRAINT "Class_pkey",
DROP COLUMN "grade",
DROP COLUMN "studentIds",
DROP COLUMN "updatedAt",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "subjectId" INTEGER NOT NULL,
ADD COLUMN     "teacherId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "homeroomTeacherId",
ADD COLUMN     "homeroomTeacherId" INTEGER,
ADD CONSTRAINT "Class_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_pkey",
DROP COLUMN "description",
DROP COLUMN "updatedAt",
DROP COLUMN "videoUrl",
ADD COLUMN     "content" TEXT,
ADD COLUMN     "youtubeUrl" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "topicId",
ADD COLUMN     "topicId" INTEGER,
ADD CONSTRAINT "Material_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Subject" DROP CONSTRAINT "Subject_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "teacherIds",
DROP COLUMN "updatedAt",
ADD COLUMN     "grade" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Subject_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Topic" DROP CONSTRAINT "Topic_pkey",
DROP COLUMN "description",
DROP COLUMN "subjectId",
DROP COLUMN "updatedAt",
ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Topic_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."_ClassToSubject";

-- CreateTable
CREATE TABLE "public"."Class_Members" (
    "classId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "Class_Members_pkey" PRIMARY KEY ("studentId","classId")
);

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Topic" ADD CONSTRAINT "Topic_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Class_Members" ADD CONSTRAINT "Class_Members_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
