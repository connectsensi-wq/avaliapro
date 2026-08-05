import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/taxes?companyId=...
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

    // 1. Buscar todas as parcelas recebidas (PaymentInstallment) da empresa
    // Relacionamento: PaymentInstallment -> accounts_receivable -> invoice (com total_amount e retentions)
    const installments = await db.paymentInstallment.findMany({
      where: {
        accounts_receivable: {
          companyId,
        },
      },
      include: {
        accounts_receivable: {
          include: {
            client: true,
            invoice: {
              include: {
                retentions: true,
              },
            },
          },
        },
      },
      orderBy: {
        payment_date: "asc",
      },
    });

    // 2. Buscar todas as NFS-e emitidas da empresa (para o ISS por Competência)
    const invoices = await db.invoice.findMany({
      where: {
        companyId,
        status: { not: "cancelada" },
      },
      include: {
        client: true,
        retentions: true,
      },
      orderBy: {
        issue_date: "asc",
      },
    });

    return NextResponse.json({
      installments,
      invoices,
    });
  } catch (error) {
    console.error("GET /api/taxes error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados de apuração de impostos" },
      { status: 500 }
    );
  }
}
