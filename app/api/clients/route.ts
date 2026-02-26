import db from "@/lib/db";
import { NextResponse } from "next/server";


// GET /api/clients
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId"); // pega o id da empresa pela query string

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    const clients = await db.client.findMany({
      where: { companyId }, // filtra apenas clientes da empresa
      include: { contacts: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST /api/clients
export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("Dados recebidos no POST /api/clients:", data);

    if (!data.companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    // Converter datas, se vierem como string
    if (data.constitution_date) {
      data.constitution_date = new Date(data.constitution_date);
    }

    // Ajustar contatos para o formato esperado pelo Prisma
    const contacts =
      data.contacts && data.contacts.length > 0
        ? {
            create: data.contacts.map((c: any) => ({
              name: c.name,
              phone: c.phone,
              email: c.email,
            })),
          }
        : undefined;

    const client = await db.client.create({
      data: {
        ...data,
        contacts, // usa nested create
      },
      include: {
        contacts: true, // já retorna os contatos criados
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}