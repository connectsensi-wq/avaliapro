"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Percent,
  Calendar,
  Layers,
} from "lucide-react";
import { toBRLDecimal } from "@/lib/utils";

interface TaxProjectionProps {
  invoices: any[];
  installments: any[];
  companyName?: string;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const QUARTERS = [
  { value: "1", label: "1º Trimestre (Jan - Mar)", months: [1, 2, 3] },
  { value: "2", label: "2º Trimestre (Abr - Jun)", months: [4, 5, 6] },
  { value: "3", label: "3º Trimestre (Jul - Set)", months: [7, 8, 9] },
  { value: "4", label: "4º Trimestre (Out - Dez)", months: [10, 11, 12] },
];

export default function TaxProjection({ invoices, installments = [], companyName }: TaxProjectionProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  // Filtros de Período
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    Math.ceil(currentMonth / 3).toString()
  );

  // Saldos credores acumulados de períodos anteriores (Etapa 1 vs Etapa 2)
  const [prevPisCredit, setPrevPisCredit] = useState<number>(0);
  const [prevCofinsCredit, setPrevCofinsCredit] = useState<number>(0);
  const [prevIrpjCredit, setPrevIrpjCredit] = useState<number>(0);
  const [prevCsllCredit, setPrevCsllCredit] = useState<number>(0);

  // Determinar meses do trimestre selecionado
  const quarterMonths = useMemo(() => {
    const q = QUARTERS.find((item) => item.value === selectedQuarter);
    return q ? q.months : [1, 2, 3];
  }, [selectedQuarter]);

  // 1. REGIME DE CAIXA: Filtrar parcelas recebidas em PaymentInstallment no Mês Selecionado
  // Relacionamento: PaymentInstallment -> accounts_receivable -> invoice -> total_amount (Valor Bruto da NFS)
  const monthCashData = useMemo(() => {
    let grossCashReceived = 0;
    let pisRetained = 0;
    let cofinsRetained = 0;
    let irpjRetained = 0;
    let csllRetained = 0;
    const installmentsList: any[] = [];

    installments.forEach((inst: any) => {
      if (!inst.payment_date) return;
      const pDate = new Date(inst.payment_date);
      const pYear = pDate.getUTCFullYear();
      const pMonth = pDate.getUTCMonth() + 1;

      if (pYear === selectedYear && pMonth === selectedMonth) {
        const accRec = inst.accounts_receivable || {};
        const invoice = accRec.invoice || {};
        const retentions = invoice.retentions || {};

        // Valor Bruto da NFS recebida no período vem de Invoice.total_amount
        const nfsTotalAmount = Number(invoice.total_amount || accRec.amount || inst.amount_paid || 0);
        const amountPaid = Number(inst.amount_paid || 0);

        // Usar o Valor Bruto da NFS-e vinculada
        grossCashReceived += nfsTotalAmount;

        pisRetained += Number(retentions.pis_pasep || 0);
        cofinsRetained += Number(retentions.cofins || 0);
        irpjRetained += Number(retentions.irpj || 0);
        csllRetained += Number(retentions.csll || 0);

        installmentsList.push({
          id: inst.id,
          client_name: accRec.client?.name || invoice.client?.name || "Cliente N/A",
          document: accRec.document || invoice.invoice_number || "NFS-e N/A",
          payment_date: inst.payment_date,
          nfs_total_amount: nfsTotalAmount,
          amount_paid: amountPaid,
          discount: inst.discount || 0,
        });
      }
    });

    return {
      grossCashReceived,
      pisRetained,
      cofinsRetained,
      irpjRetained,
      csllRetained,
      installmentsList,
    };
  }, [installments, selectedYear, selectedMonth]);

  // 2. REGIME DE CAIXA: Filtrar parcelas recebidas em PaymentInstallment no Trimestre Selecionado (para IRPJ e CSLL)
  const quarterCashData = useMemo(() => {
    let grossCashReceived = 0;
    let irpjRetained = 0;
    let csllRetained = 0;

    installments.forEach((inst: any) => {
      if (!inst.payment_date) return;
      const pDate = new Date(inst.payment_date);
      const pYear = pDate.getUTCFullYear();
      const pMonth = pDate.getUTCMonth() + 1;

      if (pYear === selectedYear && quarterMonths.includes(pMonth)) {
        const accRec = inst.accounts_receivable || {};
        const invoice = accRec.invoice || {};
        const retentions = invoice.retentions || {};

        const nfsTotalAmount = Number(invoice.total_amount || accRec.amount || inst.amount_paid || 0);

        grossCashReceived += nfsTotalAmount;

        irpjRetained += Number(retentions.irpj || 0);
        csllRetained += Number(retentions.csll || 0);
      }
    });

    return {
      grossCashReceived,
      irpjRetained,
      csllRetained,
    };
  }, [installments, selectedYear, quarterMonths]);

  // 3. REGIME DE COMPETÊNCIA: Filtrar NFS-e Emitidas no Mês Selecionado (para ISS)
  const monthCompetenceData = useMemo(() => {
    let baseIssAmount = 0;
    let totalIssAmount = 0;
    const issuedInvoices: any[] = [];

    invoices.forEach((inv) => {
      if (!inv.issue_date) return;
      const iDate = new Date(inv.issue_date);
      const iYear = iDate.getUTCFullYear();
      const iMonth = iDate.getUTCMonth() + 1;

      if (iYear === selectedYear && iMonth === selectedMonth) {
        const base = Number(inv.base_amount || inv.total_amount || 0);
        const rate = Number(inv.tax_rate || 2.0); // 2% padrão se não informado
        const iss = inv.iss_amount ? Number(inv.iss_amount) : base * (rate / 100);

        baseIssAmount += base;
        totalIssAmount += iss;

        issuedInvoices.push({
          id: inv.id,
          invoice_number: inv.invoice_number,
          issue_date: inv.issue_date,
          client_name: inv.client?.name || "N/A",
          base_amount: base,
          tax_rate: rate,
          iss_amount: iss,
        });
      }
    });

    return {
      baseIssAmount,
      totalIssAmount,
      issuedInvoices,
    };
  }, [invoices, selectedYear, selectedMonth]);

  // --- CÁLCULOS DOS IMPOSTOS ---

  // PIS (Mensal - 0,65%)
  const pisCalculation = useMemo(() => {
    const base = monthCashData.grossCashReceived;
    const grossTax = base * 0.0065;
    const retained = monthCashData.pisRetained;
    const currentPeriodNet = grossTax - retained;
    const rawFinal = currentPeriodNet - prevPisCredit;
    const toPay = Math.max(0, rawFinal);
    const nextCredit = rawFinal < 0 ? Math.abs(rawFinal) : 0;

    return { base, grossTax, retained, currentPeriodNet, toPay, nextCredit };
  }, [monthCashData, prevPisCredit]);

  // COFINS (Mensal - 3,00%)
  const cofinsCalculation = useMemo(() => {
    const base = monthCashData.grossCashReceived;
    const grossTax = base * 0.03;
    const retained = monthCashData.cofinsRetained;
    const currentPeriodNet = grossTax - retained;
    const rawFinal = currentPeriodNet - prevCofinsCredit;
    const toPay = Math.max(0, rawFinal);
    const nextCredit = rawFinal < 0 ? Math.abs(rawFinal) : 0;

    return { base, grossTax, retained, currentPeriodNet, toPay, nextCredit };
  }, [monthCashData, prevCofinsCredit]);

  // IRPJ (Trimestral - Presunção 8% até 1,2M e 8,8% no excedente + Adicional IR 10% sobre presunção > 60k)
  const irpjCalculation = useMemo(() => {
    const base = quarterCashData.grossCashReceived;

    // Alíquota de Presunção de Lucro
    let presumption = 0;
    let baseUpTo12M = Math.min(base, 1200000);
    let baseExcess = Math.max(0, base - 1200000);

    presumption = baseUpTo12M * 0.08 + baseExcess * 0.088;

    // Alíquota IRPJ Normal (15%)
    const basicTax = presumption * 0.15;

    // Adicional do Imposto de Renda (10% sobre presunção > R$ 60.000 no trimestre)
    const additionalBase = Math.max(0, presumption - 60000);
    const additionalTax = additionalBase * 0.1;

    const totalGrossTax = basicTax + additionalTax;
    const retained = quarterCashData.irpjRetained;
    const currentPeriodNet = totalGrossTax - retained;
    const rawFinal = currentPeriodNet - prevIrpjCredit;
    const toPay = Math.max(0, rawFinal);
    const nextCredit = rawFinal < 0 ? Math.abs(rawFinal) : 0;

    return {
      base,
      baseUpTo12M,
      baseExcess,
      presumption,
      basicTax,
      additionalBase,
      additionalTax,
      totalGrossTax,
      retained,
      currentPeriodNet,
      toPay,
      nextCredit,
    };
  }, [quarterCashData, prevIrpjCredit]);

  // CSLL (Trimestral - Presunção 12% até 1,2M e 13,2% no excedente + Alíquota CSLL 9%)
  const csllCalculation = useMemo(() => {
    const base = quarterCashData.grossCashReceived;

    let presumption = 0;
    let baseUpTo12M = Math.min(base, 1200000);
    let baseExcess = Math.max(0, base - 1200000);

    presumption = baseUpTo12M * 0.12 + baseExcess * 0.132;

    const grossTax = presumption * 0.09;
    const retained = quarterCashData.csllRetained;
    const currentPeriodNet = grossTax - retained;
    const rawFinal = currentPeriodNet - prevCsllCredit;
    const toPay = Math.max(0, rawFinal);
    const nextCredit = rawFinal < 0 ? Math.abs(rawFinal) : 0;

    return {
      base,
      baseUpTo12M,
      baseExcess,
      presumption,
      grossTax,
      retained,
      currentPeriodNet,
      toPay,
      nextCredit,
    };
  }, [quarterCashData, prevCsllCredit]);

  // ISS (Mensal - Competência 2%)
  const issCalculation = useMemo(() => {
    const base = monthCompetenceData.baseIssAmount;
    const toPay = monthCompetenceData.totalIssAmount;

    return { base, toPay };
  }, [monthCompetenceData]);

  // Total Geral a Recolher
  const grandTotalToPay = useMemo(() => {
    return (
      pisCalculation.toPay +
      cofinsCalculation.toPay +
      irpjCalculation.toPay +
      csllCalculation.toPay +
      issCalculation.toPay
    );
  }, [pisCalculation, cofinsCalculation, irpjCalculation, csllCalculation, issCalculation]);

  return (
    <div className="space-y-6 font-sans text-foreground">
      {/* Banner Executivo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Regime de Caixa & Competência (Lucro Presumido)
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Percent className="w-6 h-6 text-primary" />
              Projeção e Apuração Tributária
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Cálculo estimativo de PIS, COFINS, IRPJ, CSLL e ISS para a empresa ativada no sistema
            </p>
          </div>

          <div className="bg-card/90 border border-border p-3.5 rounded-xl shadow-lg text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
              Total Impostos a Recolher
            </span>
            <span className="text-2xl font-black text-primary font-mono">
              R$ {toBRLDecimal(grandTotalToPay.toFixed(2))}
            </span>
          </div>
        </div>
      </div>

      {/* Painel de Filtros de Período e Simulação de Saldo Credor */}
      <Card className="bg-card border-border rounded-2xl shadow-md">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Filtros de Apuração & Saldos Anteriores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Seletor de Ano */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Ano de Referência</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Mês (PIS, COFINS, ISS) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Mês (PIS, COFINS, ISS)
              </Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {MONTH_NAMES.map((mName, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {mName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Trimestre (IRPJ e CSLL) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Trimestre (IRPJ & CSLL)
              </Label>
              <Select
                value={selectedQuarter}
                onValueChange={(val) => setSelectedQuarter(val)}
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {QUARTERS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resumo da Empresa Selecionada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Empresa Ativa</Label>
              <div className="h-10 px-3 bg-secondary/40 border border-border rounded-xl flex items-center justify-between text-xs font-bold text-primary truncate">
                <span className="truncate">{companyName || "Empresa Ativa"}</span>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                  Lucro Presumido
                </Badge>
              </div>
            </div>
          </div>

          {/* Etapa 1 & Etapa 2: Inserção de Saldo Credor Acumulado Anterior */}
          <div className="p-4 bg-secondary/30 border border-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Etapa 1: Saldo Credor do Período Anterior (Abatimentos)
              </h4>
              <span className="text-[10px] text-muted-foreground italic">
                Insira créditos fiscais acumulados do período anterior se houver
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Crédito PIS (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prevPisCredit}
                  onChange={(e) => setPrevPisCredit(parseFloat(e.target.value) || 0)}
                  className="bg-background border-border text-foreground text-xs font-mono text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Crédito COFINS (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prevCofinsCredit}
                  onChange={(e) => setPrevCofinsCredit(parseFloat(e.target.value) || 0)}
                  className="bg-background border-border text-foreground text-xs font-mono text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Crédito IRPJ (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prevIrpjCredit}
                  onChange={(e) => setPrevIrpjCredit(parseFloat(e.target.value) || 0)}
                  className="bg-background border-border text-foreground text-xs font-mono text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Crédito CSLL (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prevCsllCredit}
                  onChange={(e) => setPrevCsllCredit(parseFloat(e.target.value) || 0)}
                  className="bg-background border-border text-foreground text-xs font-mono text-right"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards de Impostos Calculados */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* PIS */}
        <Card className="bg-card border-border rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">PIS</span>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
              0,65% • Caixa
            </Badge>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono pt-1">
            R$ {toBRLDecimal(pisCalculation.toPay.toFixed(2))}
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
            <div>Faturamento Mês: R$ {toBRLDecimal(pisCalculation.base.toFixed(2))}</div>
            <div>Retenções PIS: R$ {toBRLDecimal(pisCalculation.retained.toFixed(2))}</div>
            {pisCalculation.nextCredit > 0 && (
              <div className="text-amber-400 font-semibold">
                Crédito Acumulado: R$ {toBRLDecimal(pisCalculation.nextCredit.toFixed(2))}
              </div>
            )}
          </div>
        </Card>

        {/* COFINS */}
        <Card className="bg-card border-border rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">COFINS</span>
            <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">
              3,00% • Caixa
            </Badge>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono pt-1">
            R$ {toBRLDecimal(cofinsCalculation.toPay.toFixed(2))}
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
            <div>Faturamento Mês: R$ {toBRLDecimal(cofinsCalculation.base.toFixed(2))}</div>
            <div>Retenções COFINS: R$ {toBRLDecimal(cofinsCalculation.retained.toFixed(2))}</div>
            {cofinsCalculation.nextCredit > 0 && (
              <div className="text-amber-400 font-semibold">
                Crédito Acumulado: R$ {toBRLDecimal(cofinsCalculation.nextCredit.toFixed(2))}
              </div>
            )}
          </div>
        </Card>

        {/* IRPJ */}
        <Card className="bg-card border-border rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">IRPJ</span>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
              15% + Adic. 10%
            </Badge>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono pt-1">
            R$ {toBRLDecimal(irpjCalculation.toPay.toFixed(2))}
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
            <div>Fat. Trimestre: R$ {toBRLDecimal(irpjCalculation.base.toFixed(2))}</div>
            <div>Adicional IR: R$ {toBRLDecimal(irpjCalculation.additionalTax.toFixed(2))}</div>
            {irpjCalculation.nextCredit > 0 && (
              <div className="text-amber-400 font-semibold">
                Crédito Acumulado: R$ {toBRLDecimal(irpjCalculation.nextCredit.toFixed(2))}
              </div>
            )}
          </div>
        </Card>

        {/* CSLL */}
        <Card className="bg-card border-border rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">CSLL</span>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
              9% • Trimestre
            </Badge>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono pt-1">
            R$ {toBRLDecimal(csllCalculation.toPay.toFixed(2))}
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
            <div>Fat. Trimestre: R$ {toBRLDecimal(csllCalculation.base.toFixed(2))}</div>
            <div>Retenções CSLL: R$ {toBRLDecimal(csllCalculation.retained.toFixed(2))}</div>
            {csllCalculation.nextCredit > 0 && (
              <div className="text-amber-400 font-semibold">
                Crédito Acumulado: R$ {toBRLDecimal(csllCalculation.nextCredit.toFixed(2))}
              </div>
            )}
          </div>
        </Card>

        {/* ISS */}
        <Card className="bg-card border-border rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">ISS</span>
            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">
              2,00% • Competência
            </Badge>
          </div>
          <div className="text-xl font-extrabold text-primary font-mono pt-1">
            R$ {toBRLDecimal(issCalculation.toPay.toFixed(2))}
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
            <div>Base Emitida: R$ {toBRLDecimal(issCalculation.base.toFixed(2))}</div>
            <div>Apuração no Mês</div>
          </div>
        </Card>
      </div>

      {/* Abas com a Memória de Cálculo Detalhada */}
      <Tabs defaultValue="pis_cofins" className="w-full">
        {/* Ajustado para w-full e flexível para telas menores */}
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 bg-card border border-border p-1.5 rounded-xl gap-1 h-auto">
          <TabsTrigger
            value="pis_cofins"
            className="w-full text-[11px] sm:text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg py-1.5 px-2 text-center truncate"
          >
            PIS & COFINS (Caixa)
          </TabsTrigger>
          <TabsTrigger
            value="irpj_csll"
            className="w-full text-[11px] sm:text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg py-1.5 px-2 text-center truncate"
          >
            IRPJ & CSLL (Trimestral)
          </TabsTrigger>
          <TabsTrigger
            value="iss"
            className="w-full text-[11px] sm:text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg py-1.5 px-2 text-center truncate"
          >
            ISS (Competência)
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="w-full text-[11px] sm:text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg py-1.5 px-2 text-center truncate"
          >
            Detalhamento de Notas
          </TabsTrigger>
        </TabsList>

        {/* Tab PIS & COFINS */}
        <TabsContent value="pis_cofins" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memória PIS */}
            <Card className="bg-card border-border rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="font-bold text-sm text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-2">
                <span>Memória de Cálculo - PIS (Regime de Caixa)</span>
                <span className="text-xs font-mono font-normal text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border shrink-0 self-start sm:self-auto">Alíquota: 0,65%</span>
              </h3>
              <div className="text-xs space-y-2 font-mono divide-y divide-border/60">
                <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-muted-foreground leading-tight">(+) Base de Cálculo (NFS-e Recebidas no Mês):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(pisCalculation.base.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(=) PIS Apurado Bruto (0,65%):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(pisCalculation.grossTax.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Retenções de PIS nas Notas do Mês:</span>
                  <strong className="text-emerald-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(pisCalculation.retained.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Saldo Credor PIS Período Anterior:</span>
                  <strong className="text-sky-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(prevPisCredit.toFixed(2))}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 text-sm font-extrabold">
                  <span className="text-foreground">(=) PIS a Recolher no Mês:</span>
                  <strong className="text-primary shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(pisCalculation.toPay.toFixed(2))}</strong>
                </div>
                {pisCalculation.nextCredit > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 text-xs font-bold text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span>Saldo Credor Acumulado p/ Próximo Mês:</span>
                    <span className="shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(pisCalculation.nextCredit.toFixed(2))}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Memória COFINS */}
            <Card className="bg-card border-border rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="font-bold text-sm text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-2">
                <span>Memória de Cálculo - COFINS (Regime de Caixa)</span>
                <span className="text-xs font-mono font-normal text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border shrink-0 self-start sm:self-auto">Alíquota: 3,00%</span>
              </h3>
              <div className="text-xs space-y-2 font-mono divide-y divide-border/60">
                <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-muted-foreground leading-tight">(+) Base de Cálculo (NFS-e Recebidas no Mês):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(cofinsCalculation.base.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(=) COFINS Apurado Bruto (3,00%):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(cofinsCalculation.grossTax.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Retenções de COFINS nas Notas do Mês:</span>
                  <strong className="text-emerald-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(cofinsCalculation.retained.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Saldo Credor COFINS Período Anterior:</span>
                  <strong className="text-sky-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(prevCofinsCredit.toFixed(2))}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 text-sm font-extrabold">
                  <span className="text-foreground">(=) COFINS a Recolher no Mês:</span>
                  <strong className="text-primary shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(cofinsCalculation.toPay.toFixed(2))}</strong>
                </div>
                {cofinsCalculation.nextCredit > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 text-xs font-bold text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span>Saldo Credor Acumulado p/ Próximo Mês:</span>
                    <span className="shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(cofinsCalculation.nextCredit.toFixed(2))}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab IRPJ & CSLL */}
        <TabsContent value="irpj_csll" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memória IRPJ */}
            <Card className="bg-card border-border rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="font-bold text-sm text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-2">
                <span>Memória de Cálculo - IRPJ (Trimestral)</span>
                <span className="text-xs font-mono font-normal text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border shrink-0 self-start sm:self-auto">
                  Presunção: 8% / 8,8%
                </span>
              </h3>
              <div className="text-xs space-y-2 font-mono divide-y divide-border/60">
                <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-muted-foreground leading-tight">(+) Faturamento Bruto no Trimestre:</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(irpjCalculation.base.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(=) Lucro Presumido IRPJ (8% até 1.2M + 8.8% excede):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(irpjCalculation.presumption.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(+) IRPJ Normal (15% sobre a presunção):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(irpjCalculation.basicTax.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(+) Adicional IRPJ (10% sobre presunção &gt; R$60k):</span>
                  <strong className="text-purple-400 shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(irpjCalculation.additionalTax.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Retenções IRPJ no Trimestre:</span>
                  <strong className="text-emerald-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(irpjCalculation.retained.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Saldo Credor IRPJ Trimestre Anterior:</span>
                  <strong className="text-sky-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(prevIrpjCredit.toFixed(2))}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 text-sm font-extrabold">
                  <span className="text-foreground">(=) IRPJ a Recolher no Trimestre:</span>
                  <strong className="text-primary shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(irpjCalculation.toPay.toFixed(2))}</strong>
                </div>
                {irpjCalculation.nextCredit > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 text-xs font-bold text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span>Saldo Credor Acumulado p/ Próximo Trimestre:</span>
                    <span className="shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(irpjCalculation.nextCredit.toFixed(2))}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Memória CSLL */}
            <Card className="bg-card border-border rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="font-bold text-sm text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-2">
                <span>Memória de Cálculo - CSLL (Trimestral)</span>
                <span className="text-xs font-mono font-normal text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border shrink-0 self-start sm:self-auto">
                  Presunção: 12% / 13,2%
                </span>
              </h3>
              <div className="text-xs space-y-2 font-mono divide-y divide-border/60">
                <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-muted-foreground leading-tight">(+) Faturamento Bruto no Trimestre:</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(csllCalculation.base.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(=) Lucro Presumido CSLL (12% até 1.2M + 13.2% excede):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(csllCalculation.presumption.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(=) CSLL Apurada (9% sobre a presunção):</span>
                  <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(csllCalculation.grossTax.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Retenções CSLL no Trimestre:</span>
                  <strong className="text-emerald-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(csllCalculation.retained.toFixed(2))}</strong>
                </div>
                <div className="flex items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-muted-foreground leading-tight">(-) Saldo Credor CSLL Trimestre Anterior:</span>
                  <strong className="text-sky-400 shrink-0 text-right whitespace-nowrap">- R$ {toBRLDecimal(prevCsllCredit.toFixed(2))}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 text-sm font-extrabold">
                  <span className="text-foreground">(=) CSLL a Recolher no Trimestre:</span>
                  <strong className="text-primary shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(csllCalculation.toPay.toFixed(2))}</strong>
                </div>
                {csllCalculation.nextCredit > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 text-xs font-bold text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span>Saldo Credor Acumulado p/ Próximo Trimestre:</span>
                    <span className="shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(csllCalculation.nextCredit.toFixed(2))}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab ISS */}
        <TabsContent value="iss" className="pt-4 space-y-4">
          <Card className="bg-card border-border rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="font-bold text-sm text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-2">
              <span>Memória de Cálculo - ISS (Regime de Competência - Mensal)</span>
              <span className="text-xs font-mono font-normal text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border shrink-0 self-start sm:self-auto">Alíquota: 2,00%</span>
            </h3>
            <div className="text-xs space-y-2 font-mono divide-y divide-border/60 max-w-xl">
              <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
                <span className="text-muted-foreground leading-tight">(+) Base de Cálculo ISS (NFS-e EMITIDAS no Mês):</span>
                <strong className="text-foreground shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(issCalculation.base.toFixed(2))}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 text-sm font-extrabold">
                <span className="text-foreground">(=) ISS a Recolher no Mês (2%):</span>
                <strong className="text-primary shrink-0 text-right whitespace-nowrap">R$ {toBRLDecimal(issCalculation.toPay.toFixed(2))}</strong>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab Detalhamento de Notas */}
        <TabsContent value="records" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recebimentos no Mês (Caixa) */}
            <Card className="bg-card border-border rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center justify-between">
                <span>Recebimentos no Mês (Regime de Caixa)</span>
                <Badge className="bg-secondary text-primary border-border text-[10px]">
                  {monthCashData.installmentsList.length} parcela(s)
                </Badge>
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {monthCashData.installmentsList.length > 0 ? (
                  monthCashData.installmentsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-secondary/40 border border-border p-2.5 rounded-lg text-xs flex items-center justify-between font-mono"
                    >
                      <div>
                        <div className="text-foreground font-bold">{item.client_name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          NFS-e #{item.document} • Pagamento: {item.payment_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-bold">R$ {toBRLDecimal(item.nfs_total_amount.toFixed(2))}</div>
                        <div className="text-[10px] text-muted-foreground">Pago: R$ {toBRLDecimal(item.amount_paid.toFixed(2))}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Nenhum recebimento registrado para este mês.
                  </div>
                )}
              </div>
            </Card>

            {/* NFS-e Emitidas no Mês (Competência) */}
            <Card className="bg-card border-border rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center justify-between">
                <span>NFS-e Emitidas no Mês (Competência ISS)</span>
                <Badge className="bg-secondary text-primary border-border text-[10px]">
                  {monthCompetenceData.issuedInvoices.length} nota(s)
                </Badge>
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {monthCompetenceData.issuedInvoices.length > 0 ? (
                  monthCompetenceData.issuedInvoices.map((inv, idx) => (
                    <div
                      key={idx}
                      className="bg-secondary/40 border border-border p-2.5 rounded-lg text-xs flex items-center justify-between font-mono"
                    >
                      <div>
                        <div className="text-foreground font-bold">{inv.client_name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          NFS-e #{inv.invoice_number} • Emissão: {inv.issue_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-foreground font-bold">R$ {toBRLDecimal(inv.base_amount.toFixed(2))}</div>
                        <div className="text-[10px] text-rose-400">
                          ISS (2%): R$ {toBRLDecimal(inv.iss_amount.toFixed(2))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Nenhuma NFS-e emitida neste mês.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
