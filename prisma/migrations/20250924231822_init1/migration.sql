/*
  Warnings:

  - Made the column `code` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `companies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."clients" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "code" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."companies" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "code" SET DATA TYPE TEXT;
