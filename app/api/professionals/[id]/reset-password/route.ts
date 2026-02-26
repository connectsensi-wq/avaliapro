import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { clerkUserId } = await req.json();

    if (!clerkUserId) {
      return NextResponse.json({ error: "ClerkId é obrigatório" }, { status: 400 });
    }

    const client = await clerkClient()
    await client.users.updateUser(clerkUserId, {
      password: "Tempo@2025" , // força reset de senha
    });

    return NextResponse.json(
      { success: true, message: "Senha resetada. a senha temporário é Tempo@2025" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao resetar senha do usuário:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao resetar senha" },
      { status: 500 }
    );
  }
}