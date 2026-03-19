import { NextResponse } from "next/server";
import db from "@/lib/db";

// PUT: atualizar uma invoice
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const round2 = (value: number): number => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  };

  try {
    const body = await req.json();

    const sanitizeNumber = (value: any) => round2(Number(value) || 0);

    console.log("Dados Carregados no PUT", body);

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        invoice_number: body.invoice_number,
        issue_date: body.issue_date
          ? new Date(body.issue_date)
          : undefined,
        tax_retained: body.tax_retained,
        operation_nature: body.operation_nature,
        service_code: body.service_code,
        service_location: body.service_location,
        is_substitute: body.is_substitute,
        substitute_number: body.substitute_number,
        from_rps: body.from_rps,
        total_amount: sanitizeNumber(body.total_amount),
        rps_number: body.rps_number,
        rps_date: body.rps_date
          ? new Date(body.rps_date)
          : null,
        tax_rate: sanitizeNumber(body.tax_rate),
        observations: body.observations,
        locked: body.locked,
        base_amount: sanitizeNumber(body.base_amount),
        iss_amount: sanitizeNumber(body.iss_amount),
        total_retentions: sanitizeNumber(body.total_retentions),

        // relacionamento client
        client: body.client_id
          ? { connect: { id: body.client_id } }
          : undefined,

        // relacionamento company
        company: body.companyId
          ? { connect: { id: body.companyId } }
          : undefined,

        // SERVICE ITEMS
        service_items: body.service_items
          ? {
              deleteMany: {},
              create: body.service_items.map(
                (item: any, index: number) => ({
                  professional_id: item.professional_id,
                  professional_name: item.professional_name,
                  service_value: sanitizeNumber(item.service_value),
                  description: item.description,
                  sequence: index + 1,
                })
              ),
            }
          : undefined,

        // RETENTIONS
        retentions: body.retentions
          ? {
              upsert: {
                create: {
                  inss_percentage:
                    sanitizeNumber(body.retentions.inss_percentage),
                  irpj_percentage:
                    sanitizeNumber(body.retentions.irpj_percentage),
                  csll_percentage:
                    sanitizeNumber(body.retentions.csll_percentage),
                  cofins_percentage:
                    sanitizeNumber(body.retentions.cofins_percentage),
                  pis_pasep_percentage:
                    sanitizeNumber(body.retentions.pis_pasep_percentage),
                  other_retentions_percentage:
                    sanitizeNumber(body.retentions.other_retentions_percentage),
                  inss: sanitizeNumber(body.retentions.inss),
                  irpj: sanitizeNumber(body.retentions.irpj),
                  csll: sanitizeNumber(body.retentions.csll),
                  cofins: sanitizeNumber(body.retentions.cofins),
                  pis_pasep: sanitizeNumber(body.retentions.pis_pasep),
                  other_retentions:
                    sanitizeNumber(body.retentions.other_retentions),
                },
                update: {
                  inss_percentage:
                    sanitizeNumber(body.retentions.inss_percentage),
                  irpj_percentage:
                    sanitizeNumber(body.retentions.irpj_percentage),
                  csll_percentage:
                    sanitizeNumber(body.retentions.csll_percentage),
                  cofins_percentage:
                    sanitizeNumber(body.retentions.cofins_percentage),
                  pis_pasep_percentage:
                    sanitizeNumber(body.retentions.pis_pasep_percentage),
                  other_retentions_percentage:
                    sanitizeNumber(body.retentions.other_retentions_percentage),
                  inss: sanitizeNumber(body.retentions.inss),
                  irpj: sanitizeNumber(body.retentions.irpj),
                  cofins: sanitizeNumber(body.retentions.cofins),
                  pis_pasep: sanitizeNumber(body.retentions.pis_pasep),
                  other_retentions:
                    sanitizeNumber(body.retentions.other_retentions),
                },
              },
            }
          : undefined,

        // ACCOUNTS RECEIVABLE
        accounts_receivable: body.accounts_receivable
          ? {
              upsert: {
                create: {
                  description:
                    body.accounts_receivable.description,
                  amount: sanitizeNumber(body.accounts_receivable.amount),
                  due_date: new Date(
                    body.accounts_receivable.due_date
                  ),
                  status: body.accounts_receivable.status,
                  document: body.invoice_number,
                  client: {
                    connect: {
                      id: body.accounts_receivable.client_id,
                    },
                  },
                  company: {
                    connect: { id: body.companyId },
                  },
                },
                update: {
                  description:
                    body.accounts_receivable.description,
                  amount: sanitizeNumber(body.accounts_receivable.amount),
                  due_date: new Date(
                    body.accounts_receivable.due_date
                  ),
                  status: body.accounts_receivable.status,
                  document: body.invoice_number,
                  client: {
                    connect: {
                      id: body.accounts_receivable.client_id,
                    },
                  },
                  company: {
                    connect: { id: body.companyId },
                  },
                },
              },
            }
          : undefined,

        // ACCOUNTS PAYABLE
        accounts_payable: body.accounts_payable
          ? {
              deleteMany: {},
              create: body.accounts_payable.map(
                (item: any) => ({
                  professional: item.professional_id
                    ? {
                        connect: {
                          id: item.professional_id,
                        },
                      }
                    : undefined,
                  company: {
                    connect: { id: body.companyId },
                  },
                  document: item.document,
                  description: item.description,
                  gross_amount: sanitizeNumber(item.gross_amount),
                  admin_fee_percentage:
                    sanitizeNumber(item.admin_fee_percentage),
                  admin_fee_amount:
                    sanitizeNumber(item.admin_fee_amount),
                  amount: sanitizeNumber(item.amount),
                  due_date: new Date(item.due_date),
                  status: item.status,
                })
              ),
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
    console.error("PUT /invoice/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar invoice" },
      { status: 500 }
    );
  }
}

// DELETE: excluir uma invoice (Next 15 correto)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await db.invoice.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Invoice deletada com sucesso",
    });
  } catch (error) {
    console.error("DELETE /invoice/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar invoice" },
      { status: 500 }
    );
  }
}