/*
  Warnings:

  - You are about to drop the `addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bank_accounts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `code` to the `professionals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."addresses" DROP CONSTRAINT "addresses_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bank_accounts" DROP CONSTRAINT "bank_accounts_professionalId_fkey";

-- AlterTable
ALTER TABLE "public"."professionals" ADD COLUMN     "account" TEXT,
ADD COLUMN     "account_type" "public"."AccountType",
ADD COLUMN     "address_type" "public"."AddressType",
ADD COLUMN     "agency" TEXT,
ADD COLUMN     "bank" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "state" "public"."State",
ADD COLUMN     "street" TEXT;

-- DropTable
DROP TABLE "public"."addresses";

-- DropTable
DROP TABLE "public"."bank_accounts";
