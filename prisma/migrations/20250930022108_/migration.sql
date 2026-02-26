/*
  Warnings:

  - A unique constraint covering the columns `[invoice_id]` on the table `AccountsPayable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoice_id]` on the table `AccountsReceivable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AccountsPayable_invoice_id_key" ON "public"."AccountsPayable"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "AccountsReceivable_invoice_id_key" ON "public"."AccountsReceivable"("invoice_id");
