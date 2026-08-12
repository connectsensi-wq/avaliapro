import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

// PUT /api/professionals/[id]
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do profissional não fornecido" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const userName = await getClerkUserName();
    const now = getBRTDate();

    // Converte datas se existirem
    if (data.birthday) {
      data.birthday = new Date(data.birthday);
    }
    if (data.certificate_valid_from) {
      data.certificate_valid_from = new Date(data.certificate_valid_from);
    } else if (data.certificate_valid_from === null) {
      data.certificate_valid_from = null;
    }
    if (data.certificate_valid_to) {
      data.certificate_valid_to = new Date(data.certificate_valid_to);
    } else if (data.certificate_valid_to === null) {
      data.certificate_valid_to = null;
    }

    // Remove campos que não devem ser atualizados diretamente no Prisma
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    delete data.created_by;
    delete data.updated_by;
    delete data.specialty;
    delete data.company;
    delete data.invoiceServiceItems;
    delete data.accounts_payable;

    // Sanitiza strings vazias para null
    if (!data.specialtyId) data.specialtyId = null;
    if (!data.account_type) data.account_type = null;
    if (!data.pix_key_type) data.pix_key_type = null;
    if (!data.address_type) data.address_type = null;
    if (!data.state) data.state = null;
    if (data.admin_fee_percentage !== undefined) {
      data.admin_fee_percentage = parseFloat(data.admin_fee_percentage) || 0;
    }

    const professional = await db.professional.update({
      where: { id },
      data: {
        ...data,
        updated_at: now,
        ...(userName ? { updated_by: userName } : {}),
      },
      include: {
        specialty: true,
      },
    });

    return NextResponse.json(professional, { status: 200 });
  } catch (error: any) {
    console.error("Erro no PUT /professionals/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar profissional" },
      { status: 500 }
    );
  }
}

// DELETE /api/professionals/[id]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do profissional não fornecido" },
        { status: 400 }
      );
    }

    await db.professional.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Profissional deletado com sucesso" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro no DELETE /professionals/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao deletar profissional" },
      { status: 500 }
    );
  }
}