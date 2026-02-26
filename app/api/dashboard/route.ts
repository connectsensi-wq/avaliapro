import { NextResponse } from "next/server";
import db from "@/lib/db";

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  // value may be ISO string from Prisma or raw JSON
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  try {
    const companies = await db.company.findMany();

    const invoices = await db.invoice.findMany({
      where: { companyId }
    });

    const receivables = await db.accountsReceivable.findMany({
      where: { companyId },
      include: { installments: true}
    });

    const payables = await db.accountsPayable.findMany({
      where: { companyId }
    });

    const professionals = await db.professional.findMany({
      where: { 
        companyId,
        status: "active",
      }
    });

    const clients = await db.client.findMany({
      where: { 
        companyId,
        status: "active",
      }
    });

    // Use UTC year/month to avoid timezone shifts
    const now = new Date();
    const currentYearUTC = now.getUTCFullYear();
    const currentMonthUTC = now.getUTCMonth();

    // --- cálculos
    const totalReceivable = receivables
      .filter(r => r.status === "pending")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const totalPayable = payables
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthlyRevenue = invoices
      .filter(i => {
        const d = toDate(i.issue_date);
        if (!d) return false;
        return d.getUTCFullYear() === currentYearUTC && d.getUTCMonth() === currentMonthUTC;
      })
      .reduce((sum, i) => sum + (i.base_amount || 0), 0);

    const adminFees = payables
      .filter(p => {
        const d = toDate(p.due_date);
        if (!d) return false;
        return d.getUTCFullYear() === currentYearUTC && d.getUTCMonth() === currentMonthUTC;
      })
      .reduce((sum, p) => sum + (p.admin_fee_amount || 0), 0);

    const pendingInvoices = invoices.filter(i => i.status === "regular").length;

    return NextResponse.json({
      companies,
      financialData: {
        totalReceivable,
        totalPayable,
        monthlyRevenue,
        adminFees,
        pendingInvoices,
        totalClients: clients.length,
        totalProfessionals: professionals.length,
      },
      receivables: receivables,
      invoices: invoices,
      payables: payables,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
