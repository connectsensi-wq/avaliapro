/*
  Warnings:

  - The values [Regular,Cancelada,Pendente_de_Cancelamento] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [Imune,Isento,Tributacao_no_municipio,Tributacao_fora_do_municipio,Exigibilidade_suspensa_judicial,Exigibilidade_suspensa_administrativa] on the enum `OperationNature` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."InvoiceStatus_new" AS ENUM ('regular', 'cancelada', 'pendente_de_Cancelamento');
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" TYPE "public"."InvoiceStatus_new" USING ("status"::text::"public"."InvoiceStatus_new");
ALTER TYPE "public"."InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "public"."InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" SET DEFAULT 'regular';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OperationNature_new" AS ENUM ('imune', 'isento', 'tributacao_no_municipio', 'tributacao_fora_do_municipio', 'exigibilidade_suspensa_judicial', 'exigibilidade_suspensa_administrativa');
ALTER TABLE "public"."Invoice" ALTER COLUMN "operation_nature" TYPE "public"."OperationNature_new" USING ("operation_nature"::text::"public"."OperationNature_new");
ALTER TYPE "public"."OperationNature" RENAME TO "OperationNature_old";
ALTER TYPE "public"."OperationNature_new" RENAME TO "OperationNature";
DROP TYPE "public"."OperationNature_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" SET DEFAULT 'regular';
