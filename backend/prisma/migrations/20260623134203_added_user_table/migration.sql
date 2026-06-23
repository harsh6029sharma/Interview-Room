/*
  Warnings:

  - You are about to drop the column `weakness` on the `AISummary` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `interviewId` on the `CodeSession` table. All the data in the column will be lost.
  - You are about to drop the column `candidateId` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `roomToken` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `interviewId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Submission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[interviewQuestionId]` on the table `CodeSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recommendation` to the `AISummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weaknesses` to the `AISummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interviewQuestionId` to the `CodeSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interviewQuestionId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SOLVED', 'SKIPPED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SYSTEM';

-- DropForeignKey
ALTER TABLE "CodeSession" DROP CONSTRAINT "CodeSession_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_questionId_fkey";

-- DropIndex
DROP INDEX "CodeSession_interviewId_key";

-- DropIndex
DROP INDEX "Interview_roomToken_key";

-- AlterTable
ALTER TABLE "AISummary" DROP COLUMN "weakness",
ADD COLUMN     "recommendation" TEXT NOT NULL,
ADD COLUMN     "weaknesses" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "updatedAt",
ADD COLUMN     "senderName" TEXT;

-- AlterTable
ALTER TABLE "CodeSession" DROP COLUMN "interviewId",
ADD COLUMN     "interviewQuestionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "candidateId",
DROP COLUMN "roomToken",
ADD COLUMN     "candidateEmail" TEXT,
ADD COLUMN     "candidateName" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "QuestionStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "interviewId",
DROP COLUMN "questionId",
DROP COLUMN "updatedAt",
ADD COLUMN     "interviewQuestionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CodeSession_interviewQuestionId_key" ON "CodeSession"("interviewQuestionId");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSession" ADD CONSTRAINT "CodeSession_interviewQuestionId_fkey" FOREIGN KEY ("interviewQuestionId") REFERENCES "InterviewQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_interviewQuestionId_fkey" FOREIGN KEY ("interviewQuestionId") REFERENCES "InterviewQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
