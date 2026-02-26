import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET: listar todas as invoices
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

    const professionals = await db.professional.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    
      select: {
        id: true,
        name: true,
        cpf: true,
        registration_number: true,
        bank: true,
        account_type: true,
        agency: true,
        account: true,
        pix_key_type: true,
        pix_key: true,
        admin_fee_percentage: true,
      },
    });

    return NextResponse.json(professionals

    );
  } catch (error) {
    console.error("GET /professionals error:", error);
    return NextResponse.json({ error: "Erro ao buscar professionals" }, { status: 500 });
  }
}