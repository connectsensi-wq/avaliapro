import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  req: Request,
  context: { params: { installmentId: string } }
) {
  const { installmentId } = context.params;

  try {
    const result = await db.$transaction(async (tx) => {

      // 🔍 busca installment
      const installment = await tx.paymentInstallment.findUnique({
        where: { id: installmentId },
      });

      if (!installment) {
        throw new Error("Installment não encontrado");
      }

      const receivableId = installment.accounts_receivable_id;

      // 🗑️ deleta
      await tx.paymentInstallment.delete({
        where: { id: installmentId },
      });

      // 🔄 busca restantes ORDENADO
      const remainingInstallments = await tx.paymentInstallment.findMany({
        where: { accounts_receivable_id: receivableId },
        orderBy: { payment_date: "asc" },
      });

      const totalPaid =
        remainingInstallments.reduce(
          (sum, i) => sum + i.amount_paid + (i.discount || 0),
          0
        ) || 0;

      // 📄 busca receivable
      const receivable = await tx.accountsReceivable.findUnique({
        where: { id: receivableId },
        include: { invoice: true },
      });

      if (!receivable) {
        throw new Error("Receivable não encontrado");
      }

      // 🔢 status
      let status: "pending" | "partially_paid" | "paid" = "pending";

      if (totalPaid === 0) {
        status = "pending";
      } else if (totalPaid < receivable.amount) {
        status = "partially_paid";
      } else {
        status = "paid";
      }

      // 📅 recalcula última data de pagamento
      const lastPayment =
        remainingInstallments.length > 0
          ? remainingInstallments[remainingInstallments.length - 1].payment_date
          : null;

      // 🧾 atualiza receivable
      await tx.accountsReceivable.update({
        where: { id: receivableId },
        data: {
          status,
          payment_date: lastPayment,
        },
      });

      // 🔒/🔓 controle da invoice
      if (receivable.invoice_id) {
        const shouldLock = remainingInstallments.length > 0;

        await tx.invoice.update({
          where: { id: receivable.invoice_id },
          data: { locked: shouldLock },
        });
      }

      return {
        message: "Installment deletado com sucesso",
        status,
        totalPaid,
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("DELETE installment error:", error);

    return NextResponse.json(
      { error: error.message || "Erro ao deletar installment" },
      { status: 500 }
    );
  }
}