import { NextResponse } from "next/server";
import db from "@/lib/db";

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
  const specialty = await db.specialty.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  });
  return NextResponse.json(specialty);
}