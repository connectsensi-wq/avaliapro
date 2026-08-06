import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";

export async function GET() {
  const services = await db.service.findMany({
    orderBy: { code: "desc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const body = await req.json();
  const userName = await getClerkUserName();
  const now = getBRTDate();

  const service = await db.service.create({
    data: {
      code: Number(body.code),
      description: body.description,
      created_at: now,
      updated_at: now,
      ...(userName ? { created_by: userName, updated_by: userName } : {}),
    },
  });
  return NextResponse.json(service);
}
