import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const service = await db.service.update({
    where: { id: params.id },
    data: {
      code: Number(body.code),
      description: body.description,
    },
  });
  return NextResponse.json(service);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await db.service.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
}
