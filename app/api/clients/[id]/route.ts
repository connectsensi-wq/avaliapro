import { NextResponse } from "next/server";
import db from "@/lib/db";

// PUT - atualizar cliente
export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  try {
    const data = await req.json();

    // Converter datas se vierem como string
    if (data.constitution_date) {
      data.constitution_date = new Date(data.constitution_date);
    }

    // Preparar dados para atualizar contatos
    const contactsData = data.contacts || [];
    delete data.contacts;

    const client = await db.client.update({
      where: { id },
      data: {
        ...data,
        contacts: {
          deleteMany: contactsData
            .filter((c: any) => c.delete)
            .map((c: any) => ({ id: c.id })),

          update: contactsData
            .filter((c: any) => c.id && !c.delete)
            .map((c: any) => ({
              where: { id: c.id },
              data: {
                name: c.name,
                phone: c.phone,
                email: c.email,
              },
            })),

          create: contactsData
            .filter((c: any) => !c.id && !c.delete)
            .map((c: any) => ({
              name: c.name,
              phone: c.phone,
              email: c.email,
            })),
        },
      },
      include: { contacts: true },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - remover cliente
export async function DELETE(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  try {
    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}