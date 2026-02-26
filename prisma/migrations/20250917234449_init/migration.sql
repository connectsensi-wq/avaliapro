-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('cpf', 'cnpj');

-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('alameda', 'avenida', 'estrada', 'rodovia', 'rua');

-- CreateEnum
CREATE TYPE "public"."State" AS ENUM ('AC', 'AL', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('corrente', 'poupanca');

-- CreateEnum
CREATE TYPE "public"."PixKeyType" AS ENUM ('cpf', 'email', 'phone', 'random');

-- CreateEnum
CREATE TYPE "public"."OperationNature" AS ENUM ('Imune', 'Isento', 'Tributacao_no_municipio', 'Tributacao_fora_do_municipio', 'Exigibilidade_suspensa_judicial', 'Exigibilidade_suspensa_administrativa');

-- CreateEnum
CREATE TYPE "public"."YesNo" AS ENUM ('sim', 'nao');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "code" INTEGER,
    "document" TEXT NOT NULL,
    "document_type" "public"."DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fantasy_name" TEXT,
    "address_type" "public"."AddressType",
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" "public"."State",
    "ddd" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "constitution_date" TIMESTAMP(3),
    "status" "public"."Status" NOT NULL DEFAULT 'active',

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professionals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "registration_number" TEXT,
    "specialtyId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "pix_key_type" "public"."PixKeyType",
    "pix_key" TEXT,
    "admin_fee_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'active',

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_accounts" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "account_type" "public"."AccountType" NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."addresses" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "address_type" "public"."AddressType" NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" "public"."State" NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" INTEGER,
    "document" TEXT NOT NULL,
    "document_type" "public"."DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fantasy_name" TEXT,
    "address_type" "public"."AddressType",
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" "public"."State",
    "ddd" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "is_simple_national_optant" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."Status" NOT NULL DEFAULT 'active',

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_contacts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "tax_retained" BOOLEAN NOT NULL DEFAULT false,
    "operation_nature" "public"."OperationNature" NOT NULL,
    "service_code" TEXT NOT NULL,
    "service_location" "public"."State" NOT NULL,
    "is_substitute" "public"."YesNo" NOT NULL DEFAULT 'nao',
    "substitute_number" TEXT,
    "from_rps" "public"."YesNo" NOT NULL DEFAULT 'nao',
    "rps_number" TEXT,
    "rps_date" TIMESTAMP(3),
    "base_amount" DOUBLE PRECISION NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL,
    "iss_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "observations" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_service_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL,
    "service_value" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER,

    CONSTRAINT "invoice_service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."retentions" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "inss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "irpj" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "csll" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cofins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pis_pasep" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_retentions" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "retentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "public"."companies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_cpf_key" ON "public"."professionals"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_email_key" ON "public"."professionals"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_professionalId_key" ON "public"."bank_accounts"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_professionalId_key" ON "public"."addresses"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "retentions_invoiceId_key" ON "public"."retentions"("invoiceId");

-- AddForeignKey
ALTER TABLE "public"."professionals" ADD CONSTRAINT "professionals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professionals" ADD CONSTRAINT "professionals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."addresses" ADD CONSTRAINT "addresses_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_service_items" ADD CONSTRAINT "invoice_service_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_service_items" ADD CONSTRAINT "invoice_service_items_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."retentions" ADD CONSTRAINT "retentions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
