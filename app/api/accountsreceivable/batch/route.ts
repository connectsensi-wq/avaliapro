import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ids, payment_date, observations } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta informada para a operação em lote" },
        { status: 400 }
      );
    }

    const userName = await getClerkUserName();
    const now = getBRTDate();

    if (action === "pay") {
      const paymentDate = payment_date ? new Date(payment_date) : now;

      const result = await db.$transaction(async (tx) => {
        // Busca as contas a receber
        const receivables = await tx.accountsReceivable.findMany({
          where: { id: { in: ids } },
          include: { installments: true },
        });

        if (receivables.length === 0) {
          throw new Error("Nenhuma conta encontrada");
        }

        // Validação: Todas as contas devem estar totalmente em aberto
        const hasInvalidForPay = receivables.some(
          (r) => r.status !== "pending" || (r.installments && r.installments.length > 0)
        );

        if (hasInvalidForPay) {
          throw new Error("Selecione a penas Contas em aberto.");
        }

        const updatedAccounts = [];

        for (const receivable of receivables) {
          // Cria parcela única com o valor completo da conta
          const installment = await tx.paymentInstallment.create({
            data: {
              accounts_receivable_id: receivable.id,
              amount_paid: receivable.amount,
              discount: 0,
              payment_date: paymentDate,
              observations: observations?.trim() || "Baixa completa em lote",
              created_at: now,
              updated_at: now,
              ...(userName ? { created_by: userName, updated_by: userName } : {}),
            },
          });

          // Atualiza a conta para paga
          const updated = await tx.accountsReceivable.update({
            where: { id: receivable.id },
            data: {
              status: "paid",
              payment_date: paymentDate,
            },
            include: {
              client: true,
              company: true,
              invoice: true,
              installments: true,
            },
          });

          // Se tiver invoice associada, trava a invoice
          if (receivable.invoice_id) {
            await tx.invoice.update({
              where: { id: receivable.invoice_id },
              data: { locked: true },
            });
          }

          updatedAccounts.push(updated);
        }

        return updatedAccounts;
      });

      return NextResponse.json(
        { success: true, count: result.length, accounts: result },
        { status: 200 }
      );
    }

    if (action === "delete" || action === "delete_installments") {
      await db.$transaction(async (tx) => {
        const receivables = await tx.accountsReceivable.findMany({
          where: { id: { in: ids } },
          include: { installments: true },
        });

        if (receivables.length === 0) {
          throw new Error("Nenhuma conta encontrada");
        }

        // Validação: Todas as contas devem estar totalmente baixadas (possuir baixas)
        const hasInvalidForDelete = receivables.some(
          (r) => r.status !== "paid" || !r.installments || r.installments.length === 0
        );

        if (hasInvalidForDelete) {
          throw new Error("Você está tentando excluir contas que não possuem baixas.");
        }

        // Exclui todas as parcelas das contas selecionadas
        await tx.paymentInstallment.deleteMany({
          where: { accounts_receivable_id: { in: ids } },
        });

        // Reseta o status das contas para pendente e limpa payment_date
        await tx.accountsReceivable.updateMany({
          where: { id: { in: ids } },
          data: {
            status: "pending",
            payment_date: null,
          },
        });

        // Se houver invoices associadas a essas contas, destrava as invoices
        const invoiceIds = receivables
          .map((r) => r.invoice_id)
          .filter((invId): invId is string => Boolean(invId));

        if (invoiceIds.length > 0) {
          await tx.invoice.updateMany({
            where: { id: { in: invoiceIds } },
            data: { locked: false },
          });
        }
      });

      return NextResponse.json(
        { success: true, count: ids.length, affectedIds: ids },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Ação inválida. Use 'pay' ou 'delete'." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("POST /api/accountsreceivable/batch error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao processar operação em lote de contas a receber" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta informada para exclusão de baixas" },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      const receivables = await tx.accountsReceivable.findMany({
        where: { id: { in: ids } },
        include: { installments: true },
      });

      if (receivables.length === 0) {
        throw new Error("Nenhuma conta encontrada");
      }

      // Validação: Todas as contas devem estar totalmente baixadas
      const hasInvalidForDelete = receivables.some(
        (r) => r.status !== "paid" || !r.installments || r.installments.length === 0
      );

      if (hasInvalidForDelete) {
        throw new Error("Você está tentando excluir contas que não possuem baixas.");
      }

      // Exclui todas as parcelas das contas selecionadas
      await tx.paymentInstallment.deleteMany({
        where: { accounts_receivable_id: { in: ids } },
      });

      // Reseta o status das contas para pendente e limpa payment_date
      await tx.accountsReceivable.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "pending",
          payment_date: null,
        },
      });

      // Destrava as invoices vinculadas
      const invoiceIds = receivables
        .map((r) => r.invoice_id)
        .filter((invId): invId is string => Boolean(invId));

      if (invoiceIds.length > 0) {
        await tx.invoice.updateMany({
          where: { id: { in: invoiceIds } },
          data: { locked: false },
        });
      }
    });

    return NextResponse.json(
      { success: true, count: ids.length, affectedIds: ids },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/accountsreceivable/batch error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao excluir baixas em lote" },
      { status: 400 }
    );
  }
}
