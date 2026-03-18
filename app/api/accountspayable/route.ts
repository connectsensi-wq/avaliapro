import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET
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

    // 1️⃣ contas pendentes onde o cliente já pagou
    const paidClientAccounts = await db.accountsPayable.findMany({
      where: {
        companyId,
        status: "pending",
        invoice: {
          accounts_receivable: {
            installments: {
              some: {}
            }
          }
        }
      },
      include: {
        company: true,
        invoice: {
          include: {
            client: true,
            accounts_receivable: {
              include: {
                installments: true
              }
            }
          }
        },
        installments: true,
        professional: true,
      }
    });

    // 2️⃣ restante das contas
    const otherAccounts = await db.accountsPayable.findMany({
      where: {
        companyId,
        id: {
          notIn: paidClientAccounts.map(acc => acc.id)
        }
      },
      include: {
        company: true,
        invoice: {
          include: {
            client: true,
            accounts_receivable: {
              include: {
                installments: true
              }
            }
          }
        },
        installments: true,
        professional: true,
      },
      orderBy: {
        due_date: "desc"
      }
    });

    // 3️⃣ juntar os dois resultados
    const accounts = [
      ...paidClientAccounts,
      ...otherAccounts
    ];

    return NextResponse.json({ accounts }, { status: 200 });

  } catch (error) {
    console.error("GET /accountsPayable error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contas a pagar" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      accounts_payable_id,
      amount_paid,
      payment_date,
      discount,
      observations
    } = body;

    // 🔒 Normalização
    amount_paid = Number(amount_paid);
    discount = Number(discount || 0);

    if (!accounts_payable_id || !payment_date) {
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

    const result = await db.$transaction(async (tx) => {

      const payable = await tx.accountsPayable.findUnique({
        where: { id: accounts_payable_id },
        include: { installments: true },
      });

      if (!payable) {
        throw new Error("Conta a pagar não encontrada");
      }

      const totalPaidSoFar =
        payable.installments?.reduce(
          (sum, i) => sum + i.amount_paid + (i.discount || 0),
          0
        ) || 0;

      const round = (v: number) => Number(v.toFixed(2));

      const newTotal = round(amount_paid + discount);
      const newTotalPaid = round(totalPaidSoFar + newTotal);
      const totalAmount = round(payable.amount);

      // 🚫 BLOQUEIO DE EXCESSO
      if (newTotalPaid > payable.amount) {
        throw new Error(
          `Pagamento excede o valor total. Restante: ${payable.amount - totalPaidSoFar}`
        );
      }

      // 💾 cria parcela
      const installment = await tx.paymentPayableInstallment.create({
        data: {
          accounts_payable_id,
          amount_paid,
          payment_date: new Date(payment_date),
          discount,
          observations: observations || null,
        },
      });

      // 🔢 status
      let newStatus: "pending" | "partially_paid" | "paid" = "pending";

      if (newTotalPaid === 0) {
        newStatus = "pending";
      } else if (newTotalPaid < totalAmount) {
        newStatus = "partially_paid";
      } else {
        newStatus = "paid";
      }

      // 📅 última data válida
      const latestPaymentDate =
        newStatus === "paid"
          ? new Date(payment_date)
          : payable.payment_date;

      await tx.accountsPayable.update({
        where: { id: accounts_payable_id },
        data: {
          status: newStatus,
          payment_date: latestPaymentDate,
        },
      });

      return installment;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (err: any) {
    console.error("POST /accountsPayable error:", err);

    return NextResponse.json(
      { error: err.message || "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}