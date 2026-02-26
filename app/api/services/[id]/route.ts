import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  const body = await req.json();

  const service = await db.service.update({
    where: { id },
    data: {
      code: Number(body.code),
      description: body.description,
    },
  });

  return NextResponse.json(service);
}

export async function DELETE(
  _req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  await db.service.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}