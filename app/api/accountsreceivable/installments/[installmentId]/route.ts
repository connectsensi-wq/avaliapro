import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { installmentId: string } }
) {
  const { installmentId } = params;

  try {
    // Busca o installment para descobrir o receivable relacionado
    const installment = await db.paymentInstallment.findUnique({
      where: { id: installmentId },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment não encontrado" },
        { status: 404 }
      );
    }

    const receivableId = installment.accounts_receivable_id;

    // Deleta o installment
    await db.paymentInstallment.delete({
      where: { id: installmentId },
    });

    // Recalcula os installments restantes
    const remainingInstallments = await db.paymentInstallment.findMany({
      where: { accounts_receivable_id: receivableId },
    });

    const totalPaid = remainingInstallments.reduce(
      (sum, i) => sum + i.amount_paid,
      0
    );

    // Busca o receivable com invoice associada
    const receivable = await db.accountsReceivable.findUnique({
      where: { id: receivableId },
      include: { invoice: true },
    });

    if (!receivable) {
      return NextResponse.json(
        { error: "Receivable não encontrado" },
        { status: 404 }
      );
    }

    // Define o novo status
    let status: "pending" | "partially_paid" | "paid" = "pending";

    if (totalPaid === 0) status = "pending";
    else if (totalPaid < receivable.amount) status = "partially_paid";
    else if (totalPaid >= receivable.amount) status = "paid";

    // Atualiza o receivable
    await db.accountsReceivable.update({
      where: { id: receivableId },
      data: { status },
    });

    // 🔓 Se não restar nenhum installment → desbloqueia invoice
    if (remainingInstallments.length === 0 && receivable.invoice_id) {
      await db.invoice.update({
        where: { id: receivable.invoice_id },
        data: { locked: false },
      });
    }

    return NextResponse.json({
      message: "Installment deletado, status e invoice atualizados",
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
