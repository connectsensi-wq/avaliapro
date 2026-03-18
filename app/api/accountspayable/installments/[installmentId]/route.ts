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
      const installment = await tx.paymentPayableInstallment.findUnique({
        where: { id: installmentId },
      });

      if (!installment) {
        throw new Error("Installment não encontrado");
      }

      const payableId = installment.accounts_payable_id;

      // 🗑️ deleta
      await tx.paymentPayableInstallment.delete({
        where: { id: installmentId },
      });

      // 🔄 busca restantes ORDENADO
      const remainingInstallments =
        await tx.paymentPayableInstallment.findMany({
          where: { accounts_payable_id: payableId },
          orderBy: { payment_date: "asc" },
        });

      const totalPaid =
        remainingInstallments.reduce(
          (sum, i) => sum + i.amount_paid + (i.discount || 0),
          0
        ) || 0;

      // 📄 busca payable
      const payable = await tx.accountsPayable.findUnique({
        where: { id: payableId },
      });

      if (!payable) {
        throw new Error("Conta a pagar não encontrada");
      }

      // 🔢 status
      let status: "pending" | "partially_paid" | "paid" = "pending";

      if (totalPaid === 0) {
        status = "pending";
      } else if (totalPaid < payable.amount) {
        status = "partially_paid";
      } else {
        status = "paid";
      }

      // 📅 última data válida
      const lastPayment =
        remainingInstallments.length > 0
          ? remainingInstallments[remainingInstallments.length - 1].payment_date
          : null;

      // 🧾 atualiza payable
      await tx.accountsPayable.update({
        where: { id: payableId },
        data: {
          status,
          payment_date: lastPayment,
        },
      });

      return {
        message: "Installment deletado com sucesso",
        status,
        totalPaid,
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("DELETE payable installment error:", error);

    return NextResponse.json(
      { error: error.message || "Erro ao deletar installment" },
      { status: 500 }
    );
  }
}