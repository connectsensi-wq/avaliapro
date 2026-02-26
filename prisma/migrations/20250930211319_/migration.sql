/*
  Warnings:

  - The `locked` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "locked",
ADD COLUMN     "locked" BOOLEAN;
