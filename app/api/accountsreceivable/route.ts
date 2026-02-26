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
    const body = await req.json()
    const { accounts_receivable_id, amount_paid, payment_date } = body

    if (!accounts_receivable_id || !amount_paid || !payment_date) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    // Cria a parcela
    const installment = await db.paymentInstallment.create({
      data: {
        accounts_receivable_id,
        amount_paid,
        payment_date: new Date(payment_date),
      },
    })

    // Busca o receivable com parcelas e invoice
    const receivable = await db.accountsReceivable.findUnique({
      where: { id: accounts_receivable_id },
      include: { installments: true, invoice: true },
    })

    if (receivable) {
      const totalPaid = receivable.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0
      let newStatus: "pending" | "partially_paid" | "paid" | "overdue" | "cancelled" = "pending"

      if (totalPaid === 0) {
        newStatus = "pending"
      } else if (totalPaid < receivable.amount) {
        newStatus = "partially_paid"
      } else if (totalPaid >= receivable.amount) {
        newStatus = "paid"
      }

      await db.accountsReceivable.update({
        where: { id: accounts_receivable_id },
        data: { 
          status: newStatus,
          payment_date: newStatus === "paid" ? new Date(payment_date) : null,
        },
      })

      // 🔒 Bloqueia a nota já no primeiro pagamento
      if (receivable.invoice_id) {
        await db.invoice.update({
          where: { id: receivable.invoice_id },
          data: { locked: true },
        })
      }
    }

    return NextResponse.json(installment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}

