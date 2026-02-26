import { NextResponse } from "next/server";
import db from "@/lib/db";
import { InvoiceStatus, Status } from "@/src/types/enums";

type Params = { params: { id: string } };

// declara os valores válidos usando o tipo do Prisma
const VALID_STATUSES: InvoiceStatus[] = [
  "regular",
  "cancelada",
  "pendente_de_cancelamento",
];

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const status = body?.status;

    // validação
    if (!status || typeof status !== "string" || !VALID_STATUSES.includes(status as InvoiceStatus)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }

    const invoice = await db.invoice.update({
      where: { id },
      // cast para o tipo do Prisma para agradar o TS
      data: { status: status as InvoiceStatus },
      include: {
        client: true,
        company: true,
        service_items: true,
        retentions: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("PUT /api/invoice/[id]/status error:", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Invoice não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}