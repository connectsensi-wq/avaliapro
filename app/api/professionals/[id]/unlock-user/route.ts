import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// PUT - Desbloqueia (desbane) um usuário Clerk
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

    await client.users.unbanUser(clerkUserId);

    return NextResponse.json(
      { success: true, message: "Conta do usuário desbloqueada." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao desbloquear usuário no Clerk:", error);

    const status = error?.status || 500;

    return NextResponse.json(
      {
        error: error?.message || "Erro ao desbloquear conta no Clerk",
        clerkError: error?.clerkError,
        clerkTraceId: error?.clerkTraceId,
      },
      { status }
    );
  }
}