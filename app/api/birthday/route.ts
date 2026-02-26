import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    // Mês corrente (1–12)
    const currentMonth = new Date().getMonth() + 1;

    // Busca apenas os profissionais dessa empresa
    // cujo mês de nascimento seja o mês corrente
    const professionals = await db.professional.findMany({
      where: {
        companyId,
        status: 'active',
        birthday: {
          not: null,
        },
      },
      orderBy: { name: "asc" },
    });

    // Filtra os aniversariantes do mês atual no lado do servidor
    const birthdayThisMonth = professionals.filter((p) => {
      if (!p.birthday) return false;
      const birthMonth = new Date(p.birthday).getMonth() + 1;
      return birthMonth === currentMonth;
    });

    return NextResponse.json(birthdayThisMonth, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar aniversariantes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar aniversariantes" },
      { status: 500 }
    );
  }
}
