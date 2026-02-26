import { NextResponse } from "next/server";
import db from "@/lib/db";

// Atualizar empresa (PUT)
export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  try {
    const body = await req.json();

    const company = await db.company.update({
      where: { id },
      data: {
        code: body.code,
        document: body.document,
        document_type: body.document_type,
        name: body.name,
        fantasy_name: body.fantasy_name,
        address_type: body.address_type,
        street: body.street,
        number: body.number,
        complement: body.complement,
        neighborhood: body.neighborhood,
        city: body.city,
        cep: body.cep,
        state: body.state,
        ddd: body.ddd,
        phone: body.phone,
        email: body.email,
        state_registration: body.state_registration,
        municipal_registration: body.municipal_registration,
        constitution_date: body.constitution_date
          ? new Date(body.constitution_date)
          : null,
        status: body.status,
      },
    });

    return NextResponse.json(company, { status: 200 });
  } catch (error: any) {
    console.error("PUT /companies/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa", details: error.message },
      { status: 500 }
    );
  }
}

// Deletar empresa (DELETE)
export async function DELETE(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  try {
    await db.company.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Empresa deletada com sucesso" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /companies/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar empresa", details: error.message },
      { status: 500 }
    );
  }
}