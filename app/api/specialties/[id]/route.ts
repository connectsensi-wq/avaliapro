import { NextResponse } from "next/server";
import db from "@/lib/db";

// PUT /api/specialties/:id
export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  const data = await req.json();

  const specialty = await db.specialty.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
    },
  });

  return NextResponse.json(specialty);
}

// DELETE /api/specialties/:id
export async function DELETE(
  _req: Request,
  context: any
) {
  const { params } = context;
  const { id } = params;

  await db.specialty.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}