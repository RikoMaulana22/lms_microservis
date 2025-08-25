/*
  Warnings:

  - Added the required column `type` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AssignmentType" AS ENUM ('pilgan', 'esai', 'upload_gambar', 'link_google');

-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "type" "public"."AssignmentType" NOT NULL;
