import { NextResponse } from "next/server";
import db from "@/lib/db";

interface Params {
  params: { id: string };
}

// PUT /api/specialties/:id
export async function PUT(req: Request, { params }: Params) {
  const data = await req.json();
  const specialty = await db.specialty.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description || null,
    },
  });
  return NextResponse.json(specialty);
}

// DELETE /api/specialties/:id
export async function DELETE(_req: Request, { params }: Params) {
  await db.specialty.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ ok: true });
}
