import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

// PUT /api/professionals/[id]
export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  try {
    const data = await req.json();
    const userName = await getClerkUserName();
    const now = getBRTDate();

    // Converte birthday para Date, se existir
    if (data.birthday) {
      data.birthday = new Date(data.birthday);
    }

    // Remove propriedade specialty se estiver presente
    delete data.specialty;

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
  } catch (error) {
    console.error("Erro no PUT /professionals/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar profissional" },
      { status: 500 }
    );
  }
}

// DELETE /api/professionals/[id]
export async function DELETE(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  try {
    await db.professional.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Profissional deletado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no DELETE /professionals/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao deletar profissional" },
      { status: 500 }
    );
  }
}