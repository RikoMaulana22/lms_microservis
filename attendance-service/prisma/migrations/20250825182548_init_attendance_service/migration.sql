-- CreateEnum
CREATE TYPE "DailyAttendanceStatus" AS ENUM ('HADIR', 'SAKIT', 'IZIN', 'ALPA');

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAttendance" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "status" "DailyAttendanceStatus" NOT NULL,
    "notes" TEXT,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "recordedById" INTEGER NOT NULL,
    "proofUrl" TEXT,

    CONSTRAINT "DailyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "status" "DailyAttendanceStatus" NOT NULL,
    "proofUrl" TEXT,
    "studentId" INTEGER NOT NULL,
    "attendanceId" INTEGER NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_topicId_key" ON "Attendance"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendance_date_studentId_classId_key" ON "DailyAttendance"("date", "studentId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_attendanceId_key" ON "AttendanceRecord"("studentId", "attendanceId");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
