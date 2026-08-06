import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  const body = await req.json();
  const userName = await getClerkUserName();
  const now = getBRTDate();

  const service = await db.service.update({
    where: { id },
    data: {
      code: Number(body.code),
      description: body.description,
      updated_at: now,
      ...(userName ? { updated_by: userName } : {}),
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