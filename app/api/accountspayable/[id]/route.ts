import { NextResponse } from "next/server";
import db from "@/lib/db";

interface Params {
  params: { id: string }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();

    const updatedAccount = await db.accountsPayable.update({
      where: { id: params.id },
      data: {
        status: body.status,
        payment_date: body.payment_date ? new Date(body.payment_date) : undefined,
      }
    });

    return NextResponse.json(updatedAccount);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar conta a pagar" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await db.accountsPayable.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao deletar conta a pagar" }, { status: 500 });
  }
}
