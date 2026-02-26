/*
  Warnings:

  - You are about to drop the column `company_id` on the `AccountsPayable` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `AccountsReceivable` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `AccountsPayable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `AccountsReceivable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AccountsPayable" DROP CONSTRAINT "AccountsPayable_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountsReceivable" DROP CONSTRAINT "AccountsReceivable_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_company_id_fkey";

-- AlterTable
ALTER TABLE "public"."AccountsPayable" DROP COLUMN "company_id",
ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccountsReceivable" DROP COLUMN "company_id",
ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "company_id",
ADD COLUMN     "companyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsReceivable" ADD CONSTRAINT "AccountsReceivable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsPayable" ADD CONSTRAINT "AccountsPayable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
