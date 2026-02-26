import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// PUT - Bloqueia (bane) um usuário Clerk
export async function PUT(
  req: Request,
  context: any
) {
  const { params } = context;
  const { id: clerkUserId } = params;

  try {
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "ClerkId é obrigatório" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Bloqueia a conta no Clerk
    await client.users.banUser(clerkUserId);

    return NextResponse.json(
      { success: true, message: "Conta do usuário bloqueada (banida)." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao bloquear usuário no Clerk:", error);

    const status = error?.status || 500;

    return NextResponse.json(
      {
        error: error?.message || "Erro ao bloquear conta no Clerk",
        clerkError: error?.clerkError,
        clerkTraceId: error?.clerkTraceId,
      },
      { status }
    );
  }
}