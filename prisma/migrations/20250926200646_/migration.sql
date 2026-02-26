/*
  Warnings:

  - You are about to drop the `invoice_service_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `retentions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('Regular', 'Cancelada', 'Pendente_de_Cancelamento');

-- CreateEnum
CREATE TYPE "public"."AccountsReceivableStatus" AS ENUM ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."AccountsPayableStatus" AS ENUM ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled');

-- DropForeignKey
ALTER TABLE "public"."invoice_service_items" DROP CONSTRAINT "invoice_service_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_service_items" DROP CONSTRAINT "invoice_service_items_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."retentions" DROP CONSTRAINT "retentions_invoiceId_fkey";

-- DropTable
DROP TABLE "public"."invoice_service_items";

-- DropTable
DROP TABLE "public"."invoices";

-- DropTable
DROP TABLE "public"."retentions";

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "tax_retained" BOOLEAN NOT NULL DEFAULT false,
    "operation_nature" "public"."OperationNature" NOT NULL,
    "service_code" TEXT NOT NULL,
    "service_location" TEXT NOT NULL,
    "is_substitute" "public"."YesNo" NOT NULL DEFAULT 'nao',
    "substitute_number" TEXT,
    "from_rps" "public"."YesNo" NOT NULL DEFAULT 'nao',
    "rps_number" TEXT,
    "rps_date" TIMESTAMP(3),
    "base_amount" DOUBLE PRECISION NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL,
    "iss_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "total_retentions" DOUBLE PRECISION NOT NULL,
    "observations" TEXT,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'Regular',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceServiceItem" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT,
    "service_value" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER,

    CONSTRAINT "InvoiceServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Retentions" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "inss_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "irpj_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "irpj" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "csll_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "csll" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cofins_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cofins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pis_pasep_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pis_pasep" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_retentions_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_retentions" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Retentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountsReceivable" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "client_id" TEXT,
    "client_name" TEXT,
    "document" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" "public"."AccountsReceivableStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "AccountsReceivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountsPayable" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT,
    "document" TEXT,
    "description" TEXT NOT NULL,
    "gross_amount" DOUBLE PRECISION,
    "admin_fee_percentage" DOUBLE PRECISION,
    "admin_fee_amount" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" "public"."AccountsPayableStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "AccountsPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentInstallment" (
    "id" TEXT NOT NULL,
    "accounts_receivable_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentPayableInstallment" (
    "id" TEXT NOT NULL,
    "accounts_payable_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PaymentPayableInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Retentions_invoice_id_key" ON "public"."Retentions"("invoice_id");

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceServiceItem" ADD CONSTRAINT "InvoiceServiceItem_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceServiceItem" ADD CONSTRAINT "InvoiceServiceItem_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Retentions" ADD CONSTRAINT "Retentions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsReceivable" ADD CONSTRAINT "AccountsReceivable_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsReceivable" ADD CONSTRAINT "AccountsReceivable_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsReceivable" ADD CONSTRAINT "AccountsReceivable_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsPayable" ADD CONSTRAINT "AccountsPayable_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsPayable" ADD CONSTRAINT "AccountsPayable_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountsPayable" ADD CONSTRAINT "AccountsPayable_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentInstallment" ADD CONSTRAINT "PaymentInstallment_accounts_receivable_id_fkey" FOREIGN KEY ("accounts_receivable_id") REFERENCES "public"."AccountsReceivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentPayableInstallment" ADD CONSTRAINT "PaymentPayableInstallment_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "public"."AccountsPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
