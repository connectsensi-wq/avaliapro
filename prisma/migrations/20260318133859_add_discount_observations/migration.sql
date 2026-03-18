-- AlterTable
ALTER TABLE "AccountsPayable" ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT;

-- AlterTable
ALTER TABLE "AccountsReceivable" ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT;
