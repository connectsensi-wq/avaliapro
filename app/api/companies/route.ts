import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

// GET (opcional) - listar todas as empresas
export async function GET() {
  try {
    const companies = await db.company.findMany();
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - criar empresa
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const userName = await getClerkUserName();
    const now = getBRTDate();

    // Ajusta a data de constituição para Date
    if (data.constitution_date) {
      data.constitution_date = new Date(data.constitution_date);
    }

    const company = await db.company.create({
      data: {
        ...data,
        created_at: now,
        updated_at: now,
        ...(userName ? { created_by: userName, updated_by: userName } : {}),
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}