import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 });
    }

    // Busca o maior código existente para a empresa
    const lastClient = await db.client.findMany({
      where: { companyId },
      select: { code: true },
    });

    // Converte os códigos (string) para número
    const numericCodes = lastClient
      .map((p) => Number(p.code))

    // Pega o maior valor existente ou começa do 0
    const maxCod = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;

    const nextCod = (maxCod + 1).toString();

    return NextResponse.json({ nextCod }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar próximo código:", error);
    return NextResponse.json({ error: "Erro ao buscar próximo código" }, { status: 500 });
  }
}