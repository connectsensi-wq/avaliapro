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

    const accounts = await db.accountsPayable.findMany({
      where: { companyId },
      include: {
        company: true,
        invoice: {include:{client:true}},
        installments: true,
        professional: true,
      },
        orderBy: { due_date: "desc" }
    });

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error("GET /accountsReceivable error:", error);
    return NextResponse.json({ error: "Erro ao buscar contas a pagar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log(`Dados Carregados no /POST`, body)
    const { accounts_payable_id, amount_paid, payment_date } = body

    if (!accounts_payable_id || !amount_paid || !payment_date) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    // Cria a parcela
    const installment = await db.paymentPayableInstallment.create({
      data: {
        accounts_payable_id,
        amount_paid,
        payment_date: new Date(payment_date),
      },
    })

    // Busca o Payable com parcelas e invoice
    const payable = await db.accountsPayable.findUnique({
      where: { id: accounts_payable_id },
      include: { installments: true, invoice: true },
    })

    if (payable) {
      const totalPaid = payable.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0
      let newStatus: "pending" | "partially_paid" | "paid" | "overdue" | "cancelled" = "pending"

      if (totalPaid === 0) {
        newStatus = "pending"
      } else if (totalPaid < payable.amount) {
        newStatus = "partially_paid"
      } else if (totalPaid >= payable.amount) {
        newStatus = "paid"
      }

      await db.accountsPayable.update({
        where: { id: accounts_payable_id },
        data: { 
          status: newStatus,
          payment_date: newStatus === "paid" ? new Date(payment_date) : null,
        },
      })
    }

    return NextResponse.json(installment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar contas a pagar" }, { status: 500 });
  }
}
