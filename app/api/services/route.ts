import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({
    orderBy: { code: "desc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const body = await req.json();
  const service = await db.service.create({
    data: {
      code: Number(body.code),
      description: body.description,
    },
  });
  return NextResponse.json(service);
}
