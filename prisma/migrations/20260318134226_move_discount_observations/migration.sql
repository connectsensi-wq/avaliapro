/*
  Warnings:

  - You are about to drop the column `discount` on the `AccountsPayable` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `AccountsPayable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccountsPayable" DROP COLUMN "discount",
DROP COLUMN "observations";

-- AlterTable
ALTER TABLE "PaymentInstallment" ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT;

-- AlterTable
ALTER TABLE "PaymentPayableInstallment" ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT;
