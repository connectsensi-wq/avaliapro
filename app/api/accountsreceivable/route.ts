  import { NextResponse } from "next/server";
  import db from "@/lib/db";

  // GET: listar todas as accountsPayable
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    const accounts_receivable = await db.accountsReceivable.findMany({
      where: { companyId },
      include: {
        client: true,
        company: true,
        invoice: true,
        installments: true,
      },
        orderBy: { due_date: "desc" }
    });
    
    return NextResponse.json(accounts_receivable);
  } catch (error) {
    console.error("GET /accountsReceivable error:", error);
    return NextResponse.json({ error: "Erro ao buscar contas a receber" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      accounts_receivable_id,
      amount_paid,
      payment_date,
      discount,
      observations
    } = body;

    // 🔒 Normalização
    amount_paid = Number(amount_paid);
    discount = Number(discount || 0);

    if (!accounts_receivable_id || !payment_date) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (isNaN(amount_paid) || amount_paid <= 0) {
      return NextResponse.json(
        { error: "Valor pago inválido" },
        { status: 400 }
      );
    }

    if (isNaN(discount) || discount < 0) {
      return NextResponse.json(
        { error: "Desconto inválido" },
        { status: 400 }
      );
    }

    // 🔄 TRANSACTION (CRÍTICO)
    const result = await db.$transaction(async (tx) => {

      const receivable = await tx.accountsReceivable.findUnique({
        where: { id: accounts_receivable_id },
        include: { installments: true, invoice: true },
      });

      if (!receivable) {
        throw new Error("Receivable não encontrado");
      }

      const totalPaidSoFar =
        receivable.installments?.reduce(
          (sum, i) => sum + i.amount_paid + (i.discount || 0),
          0
        ) || 0;

      const round = (value: number) => Number(value.toFixed(2));
            
      const newTotal = round(amount_paid + discount);
      const newTotalPaid = round(totalPaidSoFar + newTotal);
      const totalAmount = round(receivable.amount);

      // 🚫 BLOQUEIO FINANCEIRO
      if (newTotalPaid > receivable.amount) {
        throw new Error(
          `Pagamento excede o saldo. Restante: ${receivable.amount - totalPaidSoFar}`
        );
      }

      // ✅ cria parcela
      const installment = await tx.paymentInstallment.create({
        data: {
          accounts_receivable_id,
          amount_paid,
          payment_date: new Date(payment_date),
          discount,
          observations: observations || null,
        },
      });

      // 🔢 calcula novo status
      let newStatus: "pending" | "partially_paid" | "paid" = "pending";

      if (newTotalPaid === 0) {
        newStatus = "pending";
      } else if (newTotalPaid < totalAmount) {
        newStatus = "partially_paid";
      } else {
        newStatus = "paid";
      }

      // 📅 última data de pagamento
      const latestPaymentDate =
        newStatus === "paid"
          ? new Date(payment_date)
          : receivable.payment_date;

      await tx.accountsReceivable.update({
        where: { id: accounts_receivable_id },
        data: {
          status: newStatus,
          payment_date: latestPaymentDate,
        },
      });

      // 🔒 trava invoice se houver pagamento
      if (receivable.invoice_id) {
        await tx.invoice.update({
          where: { id: receivable.invoice_id },
          data: { locked: true },
        });
      }

      return installment;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("POST /accountsReceivable error:", error);

    return NextResponse.json(
      { error: error.message || "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}

