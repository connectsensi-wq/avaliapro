import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

// GET /api/specialties
export async function GET() {
  const specialties = await db.specialty.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(specialties);
}

// POST /api/specialties
export async function POST(req: Request) {
  const data = await req.json();
  const userName = await getClerkUserName();
  const now = getBRTDate();

  const specialty = await db.specialty.create({
    data: {
      name: data.name,
      description: data.description || null,
      created_at: now,
      updated_at: now,
      ...(userName ? { created_by: userName, updated_by: userName } : {}),
    },
  });
  return NextResponse.json(specialty);
}