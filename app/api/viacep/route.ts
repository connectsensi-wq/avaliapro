import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cep = searchParams.get("cep");

    if (!cep) {
      return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido. Informe 8 dígitos." }, { status: 400 });
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) {
      return NextResponse.json({ error: "Erro na comunicação com o serviço ViaCEP" }, { status: 502 });
    }

    const data = await response.json();
    if (data.erro) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      cep: data.cep,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      complement: data.complemento || "",
    });
  } catch (error) {
    console.error("Erro no servidor ao buscar CEP:", error);
    return NextResponse.json({ error: "Erro ao buscar CEP" }, { status: 500 });
  }
}
