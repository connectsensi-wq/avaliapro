/*
  Warnings:

  - A unique constraint covering the columns `[clerkUserId]` on the table `professionals` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."professionals" ADD COLUMN     "clerkUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "professionals_clerkUserId_key" ON "public"."professionals"("clerkUserId");
