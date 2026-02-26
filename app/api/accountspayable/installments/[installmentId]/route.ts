import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  req: Request,
  context: any
) {
  const { params } = context;
  const { installmentId } = params;

  try {
    // Busca o installment para descobrir o payable relacionado
    const installment = await db.paymentPayableInstallment.findUnique({
      where: { id: installmentId },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment não encontrado" },
        { status: 404 }
      );
    }

    const payableId = installment.accounts_payable_id;

    // Deleta o installment
    await db.paymentPayableInstallment.delete({
      where: { id: installmentId },
    });

    // Recalcula os installments restantes
    const remainingInstallments =
      await db.paymentPayableInstallment.findMany({
        where: { accounts_payable_id: payableId },
      });

    const totalPaid = remainingInstallments.reduce(
      (sum, i) => sum + i.amount_paid,
      0
    );

    // Busca o payable com invoice associada
    const payable = await db.accountsPayable.findUnique({
      where: { id: payableId },
      include: { invoice: true },
    });

    if (!payable) {
      return NextResponse.json(
        { error: "Receivable não encontrado" },
        { status: 404 }
      );
    }

    // Define o novo status
    let status: "pending" | "partially_paid" | "paid" = "pending";

    if (totalPaid === 0) status = "pending";
    else if (totalPaid < payable.amount) status = "partially_paid";
    else status = "paid";

    // Atualiza o payable
    await db.accountsPayable.update({
      where: { id: payableId },
      data: { status },
    });

    return NextResponse.json({
      message: "Installment deletado, status atualizado",
      status,
      totalPaid,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao deletar installment" },
      { status: 500 }
    );
  }
}