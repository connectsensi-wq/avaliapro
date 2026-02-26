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

    const clients = await db.client.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    
      select: {
        id: true,
        name: true,
        fantasy_name: true,
        document: true,
        document_type: true,
        address_type: true,
        street: true,
        number: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        is_simple_national_optant: true,
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("GET /clients error:", error);
    return NextResponse.json({ error: "Erro ao buscar clients" }, { status: 500 });
  }
}