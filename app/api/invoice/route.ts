import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET: listar todas as invoices
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

    const invoices = await db.invoice.findMany({
      where: { companyId },
      orderBy: { issue_date: "desc" },
    
      select: {
        id: true,
        companyId: true,
        client_id: true,
        invoice_number: true,
        issue_date: true,
        tax_retained: true,
        operation_nature: true,
        service_code: true,
        service_description: true,
        service_location: true,           
        is_substitute: true,
        substitute_number: true,
            
        from_rps: true,
        rps_number: true,
        rps_date: true,
            
        base_amount: true,
        tax_rate: true,
        iss_amount: true,
        total_amount: true,
        total_retentions: true,
            
        observations: true,
        status: true,
        locked: true,
        
        company:{
          select:{
            id: true,
            name: true,
            fantasy_name: true,
            document: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            document: true,
            document_type: true,
            phone: true,
            email: true,
            address_type: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
      
        service_items: {
          select: {
            id: true,
            professional_id: true,
            professional_name: true,
            service_value: true,
            description: true,
          },
        },
      
        retentions: {
          select: {
            id: true,
            invoice_id: true,
            inss_percentage: true,
            inss: true,
            irpj_percentage: true,
            irpj: true,
            csll_percentage: true,
            csll: true,
            cofins_percentage: true,
            cofins: true,
            pis_pasep_percentage: true,
            pis_pasep: true,
            other_retentions_percentage: true,
            other_retentions: true,
          },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET /invoices error:", error);
    return NextResponse.json({ error: "Erro ao buscar invoices" }, { status: 500 });
  }
}

// POST: criar uma nova invoice
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔎 Validação básica
    if (!body.companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`Dados Carregados no POST`, body)

    // 🔎 Converter datas que chegam como string
    body.rps_date = body.rps_date ? new Date(body.rps_date) : null;
    body.accounts_receivable.due_date =  body.accounts_receivable.due_date ? new Date(body.accounts_receivable.due_date) : null

    // 🚨 Remover do body os campos que pertencem a "retentions" (não existem em Invoice)
    const {
      inss_percentage,
      irpj_percentage,
      csll_percentage,
      cofins_percentage,
      pis_pasep_percentage,
      other_retentions_percentage,
      ...invoiceData // 👈 aqui ficam só os campos válidos para Invoice
    } = body;

    const invoice = await db.invoice.create({
      data: {
        ...invoiceData, // só dados válidos de Invoice
        issue_date: new Date(body.issue_date),

        // Criar itens relacionados (InvoiceServiceItem)
        service_items: body.service_items
          ? {
              create: body.service_items.map((item: any, index: number) => ({
                professional_id: item.professional_id,
                professional_name: item.professional_name,
                service_value: item.service_value,
                description: item.description,
                sequence: index + 1,
              })),
            }
          : undefined,

        // Criar Retenções (vai somente para a tabela Retentions)
        retentions: body.retentions
          ? {
              create: {
                inss_percentage: body.retentions.inss_percentage,
                inss: body.retentions.inss,
                irpj_percentage: body.retentions.irpj_percentage,
                irpj: body.retentions.irpj,
                csll_percentage: body.retentions.csll_percentage,
                csll: body.retentions.csll,
                cofins_percentage: body.retentions.cofins_percentage,
                cofins: body.retentions.cofins,
                pis_pasep_percentage: body.retentions.pis_pasep_percentage,
                pis_pasep: body.retentions.pis_pasep,
                other_retentions_percentage:
                  body.retentions.other_retentions_percentage,
                other_retentions: body.retentions.other_retentions,
              },
            }
          : undefined,
        accounts_receivable: body.accounts_receivable
          ?{
            create: {
              description: body.accounts_receivable.description,
              amount: body.accounts_receivable.amount,
              due_date: body.accounts_receivable.due_date,
              status: body.accounts_receivable.status,
              document: body.invoice_number,
              client: {
                connect: { id: body.accounts_receivable.client_id}
              },
              company:{
                connect: { id: body.companyId}
              }
            },
          }
          : undefined,
      accounts_payable: body.accounts_payable
        ? {
            create: body.accounts_payable.map((item: any) => ({
              professional: item.professional_id
                ? { connect: { id: item.professional_id } }
                : undefined,
              company: { connect: { id: body.companyId } },
              document: item.document,
              description: item.description,
              gross_amount: item.gross_amount,
              admin_fee_percentage: item.admin_fee_percentage,
              admin_fee_amount: item.admin_fee_amount,
              amount: item.amount,
              due_date: new Date(item.due_date), // 👈 conversão de string → Date
              status: item.status,
            })),
          }
        : undefined,
      },
      include: {
        client: true,
        company: true,
        service_items: true,
        retentions: true,
        accounts_receivable: true,
        accounts_payable: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("POST /invoices error:", error);
    return NextResponse.json(
      { error: "Erro ao criar invoice" },
      { status: 500 }
    );
  }
}
