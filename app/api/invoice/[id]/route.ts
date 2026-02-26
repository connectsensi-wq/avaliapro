import { NextResponse } from "next/server";
import db from "@/lib/db";

// PUT: atualizar uma invoice
export async function PUT(
  req: Request,
  context: any
){
  const { params } = context;
  const { id } = params;

  try {
    const body = await req.json();

    console.log(`Dados Carregados no PUT`, body);

    body.rps_date = body.rps_date ? new Date(body.rps_date) : null;

    const {
      inss_percentage,
      irpj_percentage,
      csll_percentage,
      cofins_percentage,
      pis_pasep_percentage,
      other_retentions_percentage,
      ...invoiceData
    } = body;

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        issue_date: body.issue_date ? new Date(body.issue_date) : undefined,

        service_items: body.service_items
          ? {
              deleteMany: {},
              create: body.service_items.map((item: any, index: number) => ({
                professional_id: item.professional_id,
                professional_name: item.professional_name,
                service_value: item.service_value,
                description: item.description,
                sequence: index + 1,
              })),
            }
          : undefined,

        retentions: body.retentions
          ? {
              upsert: {
                create: { ...body.retentions },
                update: { ...body.retentions },
              },
            }
          : undefined,

        accounts_receivable: body.accounts_receivable
          ? {
              upsert: {
                create: {
                  ...body.accounts_receivable,
                  document: body.invoice_number,
                  client: {
                    connect: { id: body.accounts_receivable.client_id }
                  },
                  company: {
                    connect: { id: body.companyId }
                  }
                },
                update: {
                  ...body.accounts_receivable,
                  document: body.invoice_number,
                  client: {
                    connect: { id: body.accounts_receivable.client_id }
                  },
                  company: {
                    connect: { id: body.companyId }
                  }
                },
              },
            }
          : undefined,

        accounts_payable: body.accounts_payable
          ? {
              deleteMany: {},
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
                due_date: new Date(item.due_date),
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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("PUT /invoices error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar invoice" },
      { status: 500 }
    );
  }
}

// DELETE: excluir uma invoice
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    await db.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Invoice deletada com sucesso" });
  } catch (error) {
    console.error("DELETE /invoices error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar invoice" },
      { status: 500 }
    );
  }
}