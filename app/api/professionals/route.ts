import { NextResponse } from "next/server";
import db from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";


// GET /api/professionals
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
      include: {
        specialty: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(professionals, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar profissionais" },
      { status: 500 }
    );
  }
}

// POST /api/professionals
export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    // Converter datas
    if (data.birthday) {
      data.birthday = new Date(data.birthday);
    }

     // Verifica se já existe cliente com mesmo documento (CPF/CNPJ)
    const existingCpf = await db.professional.findFirst({
      where: {
        cpf: data.cpf,
      },
    });

    if (existingCpf) {
      return NextResponse.json(
        { error: "Já existe um profissional com este CPF/CNPJ." },
        { status: 400 }
      );
    }

    // Verifica se já existe cliente com mesmo e-mail
    if (data.email) {
      const existingEmail = await db.professional.findFirst({
        where: {
          email: data.email,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Já existe um profissional com este e-mail." },
          { status: 400 }
        );
      }
    }

    // Criar usuário no Clerk
    const names = data.name.trim().split(" ");
    const firstName = names[0];
    const lastName = names.length > 1 ? names[names.length - 1] : "";
    
    const client = await clerkClient()
    const user = await client.users.createUser({
      emailAddress: [data.email],
      firstName: firstName,
      username: `user_${data.cpf}`,
      lastName: lastName,
      password: "Viusion@2025Secure", // senha temporária
      publicMetadata: { role: "professional" },
    });

    // Criar profissional no banco e linkar com o Clerk
    const professional = await db.professional.create({
      data: {
        ...data,
        clerkUserId: user.id,
      },
      include: { specialty: true },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error("Erro no POST /professionals:", error);
    return NextResponse.json(
      { error: "Erro ao criar profissional" },
      { status: 500 }
    );
  }
}
