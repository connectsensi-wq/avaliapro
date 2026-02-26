/*
  Warnings:

  - A unique constraint covering the columns `[client_id]` on the table `AccountsReceivable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AccountsReceivable_client_id_key" ON "public"."AccountsReceivable"("client_id");
