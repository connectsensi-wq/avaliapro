import { NextResponse } from "next/server";
import db from "@/lib/db"; // seu prisma client singleton

// PUT - atualizar  cliente
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const id = params.id;

    // Converter datas se vierem como string
    if (data.constitution_date) {
      data.constitution_date = new Date(data.constitution_date);
    }

    // Preparar dados para atualizar contatos
    const contactsData = data.contacts || [];
    delete data.contacts; // remove para não causar conflito no update do client

    const client = await db.client.update({
      where: { id },
      data: {
        ...data,
        contacts: {
          // Apaga contatos que vieram com uma flag 'delete: true'
          deleteMany: contactsData.filter((c: any) => c.delete).map((c: any) => ({ id: c.id })),

          // Atualiza contatos existentes (devem ter id)
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

          // Cria novos contatos (não possuem id)
          create: contactsData
            .filter((c: any) => !c.id && !c.delete)
            .map((c: any) => ({
              name: c.name,
              phone: c.phone,
              email: c.email,
            })),
        },
      },
      include: { contacts: true }, // retorna os contatos atualizados
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - remover cliente
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.client.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}