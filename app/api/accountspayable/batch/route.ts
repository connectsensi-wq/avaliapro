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
        // Busca as contas a pagar
        const payables = await tx.accountsPayable.findMany({
          where: { id: { in: ids } },
        });

        if (payables.length === 0) {
          throw new Error("Nenhuma conta encontrada");
        }

        const updatedAccounts = [];

        for (const payable of payables) {
          // Exclui parcelas anteriores para que a baixa seja total e limpa
          await tx.paymentPayableInstallment.deleteMany({
            where: { accounts_payable_id: payable.id },
          });

          // Cria parcela única com o valor completo da conta
          const installment = await tx.paymentPayableInstallment.create({
            data: {
              accounts_payable_id: payable.id,
              amount_paid: payable.amount,
              discount: 0,
              payment_date: paymentDate,
              observations: observations?.trim() || "Baixa completa em lote",
              created_at: now,
              updated_at: now,
              ...(userName ? { created_by: userName, updated_by: userName } : {}),
            },
          });

          // Atualiza a conta para paga
          const updated = await tx.accountsPayable.update({
            where: { id: payable.id },
            data: {
              status: "paid",
              payment_date: paymentDate,
            },
            include: {
              installments: true,
              professional: true,
              invoice: {
                include: {
                  client: true,
                  accounts_receivable: {
                    include: {
                      installments: true,
                    },
                  },
                },
              },
            },
          });

          updatedAccounts.push(updated);
        }

        return updatedAccounts;
      });

      return NextResponse.json(
        { success: true, count: result.length, accounts: result },
        { status: 200 }
      );
    }

    if (action === "delete") {
      await db.$transaction(async (tx) => {
        // Exclui todas as parcelas das contas selecionadas
        await tx.paymentPayableInstallment.deleteMany({
          where: { accounts_payable_id: { in: ids } },
        });

        // Exclui as contas a pagar
        await tx.accountsPayable.deleteMany({
          where: { id: { in: ids } },
        });
      });

      return NextResponse.json(
        { success: true, count: ids.length, deletedIds: ids },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Ação inválida. Use 'pay' ou 'delete'." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("POST /api/accountspayable/batch error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao processar operação em lote de contas a pagar" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta informada para exclusão" },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      // Exclui todas as parcelas das contas selecionadas
      await tx.paymentPayableInstallment.deleteMany({
        where: { accounts_payable_id: { in: ids } },
      });

      // Exclui as contas a pagar
      await tx.accountsPayable.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return NextResponse.json(
      { success: true, count: ids.length, deletedIds: ids },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/accountspayable/batch error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao excluir contas a pagar em lote" },
      { status: 500 }
    );
  }
}
