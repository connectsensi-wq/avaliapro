import { NextResponse } from "next/server";
import db from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import { getClerkUserName, getBRTDate } from "@/lib/get-user-name";


// GET /api/professionals
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

    const professionals = await db.professional.findMany({
      where: { companyId },
      include: {
        specialty: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(professionals, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar profissionais" },
      { status: 500 }
    );
  }
}

// POST /api/professionals
export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    // Converter datas
    if (data.birthday) {
      data.birthday = new Date(data.birthday);
    }
    if (data.certificate_valid_from) {
      data.certificate_valid_from = new Date(data.certificate_valid_from);
    } else {
      data.certificate_valid_from = null;
    }
    if (data.certificate_valid_to) {
      data.certificate_valid_to = new Date(data.certificate_valid_to);
    } else {
      data.certificate_valid_to = null;
    }

    // Sanitiza strings vazias para null
    if (!data.specialtyId) data.specialtyId = null;
    if (!data.account_type) data.account_type = null;
    if (!data.pix_key_type) data.pix_key_type = null;
    if (!data.address_type) data.address_type = null;
    if (!data.state) data.state = null;
    if (data.admin_fee_percentage !== undefined) {
      data.admin_fee_percentage = parseFloat(data.admin_fee_percentage) || 0;
    }

    const cleanCpf = (data.cpf || "").replace(/\D/g, "");
    const targetUsername = cleanCpf ? `user_${cleanCpf}` : undefined;

    // 🔹 Consultar Clerk primeiramente por username e por e-mail antes de tentar criar novo usuário
    let clerkUserId: string | null = null;
    try {
      const client = await clerkClient();

      // 1. Consulta por username no Clerk
      if (targetUsername) {
        try {
          const userListByUsername = await client.users.getUserList({
            username: [targetUsername],
          });
          if (userListByUsername.data && userListByUsername.data.length > 0) {
            clerkUserId = userListByUsername.data[0].id;
            console.log(`[Clerk] Usuário existente encontrado por username (${targetUsername}): ${clerkUserId}`);
          }
        } catch (err) {
          console.warn("[Clerk] Erro ao buscar por username:", err);
        }
      }

      // 2. Se não encontrou por username e foi informado e-mail, consulta por e-mail no Clerk
      if (!clerkUserId && data.email) {
        try {
          const userListByEmail = await client.users.getUserList({
            emailAddress: [data.email],
          });
          if (userListByEmail.data && userListByEmail.data.length > 0) {
            clerkUserId = userListByEmail.data[0].id;
            console.log(`[Clerk] Usuário existente encontrado por e-mail (${data.email}): ${clerkUserId}`);
          }
        } catch (err) {
          console.warn("[Clerk] Erro ao buscar por email:", err);
        }
      }

      // 3. Se não existe no Clerk, cria o novo usuário
      if (!clerkUserId) {
        const names = (data.name || "").trim().split(" ");
        const firstName = names[0] || "Profissional";
        const lastName = names.length > 1 ? names[names.length - 1] : "";

        try {
          const user = await client.users.createUser({
            emailAddress: data.email ? [data.email] : undefined,
            firstName: firstName,
            username: targetUsername,
            lastName: lastName,
            password: "Vision@2025Secure", // senha temporária padrão
            publicMetadata: { role: "professional" },
          });
          clerkUserId = user.id;
          console.log(`[Clerk] Novo usuário criado com sucesso: ${clerkUserId}`);
        } catch (createErr: any) {
          console.warn("[Clerk] Aviso ao tentar criar usuário:", createErr?.message || createErr);

          // Caso de fallback: se já existia com e-mail ou username
          if (data.email) {
            const retryUsers = await client.users.getUserList({ emailAddress: [data.email] });
            if (retryUsers.data && retryUsers.data.length > 0) {
              clerkUserId = retryUsers.data[0].id;
            }
          }
        }
      }
    } catch (clerkErr) {
      console.warn("Aviso ao interagir com o Clerk:", clerkErr);
    }

    const userName = await getClerkUserName();
    const now = getBRTDate();

    // 🔹 Criar profissional no banco de dados com clerkUserId vinculado
    const professional = await db.professional.create({
      data: {
        ...data,
        clerkUserId: clerkUserId,
        created_at: now,
        updated_at: now,
        ...(userName ? { created_by: userName, updated_by: userName } : {}),
      },
      include: { specialty: true },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error("Erro no POST /professionals:", error);
    return NextResponse.json(
      { error: "Erro ao criar profissional" },
      { status: 500 }
    );
  }
}
