/*
  Warnings:

  - You are about to drop the column `professional_name` on the `AccountsPayable` table. All the data in the column will be lost.
  - You are about to drop the column `client_name` on the `AccountsReceivable` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AccountsPayable" DROP CONSTRAINT "AccountsPayable_professional_id_fkey";

-- AlterTable
ALTER TABLE "public"."AccountsPayable" DROP COLUMN "professional_name",
ALTER COLUMN "professional_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccountsReceivable" DROP COLUMN "client_name";

-- AddForeignKey
ALTER TABLE "public"."AccountsPayable" ADD CONSTRAINT "AccountsPayable_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
