"use client";

import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, RefreshCw, Sparkles } from "lucide-react";

import FinancialCards from "@/components/dashboard/financialcards";
import MonthlyChart from "@/components/dashboard/monthlychart";
import RevenueGoalCard from "@/components/dashboard/revenuegoalcard";
import AgingReceivablesCard from "@/components/dashboard/agingreceivablescard";

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [receivablesData, setReceivablesData] = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState({
    totalReceivable: 0,
    totalPayable: 0,
    monthlyRevenue: 0,
    adminFees: 0,
    totalClients: 0,
    totalProfessionals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedCompanyId = localStorage.getItem("selectedCompanyId");

      const res = await fetch(`/api/dashboard?companyId=${savedCompanyId || ""}`);
      const data = await res.json();

      setCompanies(data.companies || []);

      const currentCompany =
        savedCompanyId && data.companies
          ? data.companies.find((c: any) => c.id === savedCompanyId)
          : data.companies?.[0];

      if (currentCompany) {
        setSelectedCompany(currentCompany);
        setFinancialData(data.financialData || {});
        setReceivablesData(data.receivables || []);
        setInvoicesData(data.invoices || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do Dashboard:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-5">
          <div className="h-16 bg-slate-200 border border-slate-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 border border-slate-200 rounded-xl"></div>
              ))}
          </div>
          <div className="h-72 bg-slate-200 border border-slate-200 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Banner Executivo de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46] px-5 py-4 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-[#00F5A0]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/20 text-[#00F5A0] text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" /> Visão Executiva & Financeira
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Dashboard Geral
            </h1>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-[#001715]/80 border border-[#00453F] px-3 py-1.5 rounded-xl backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-[#00F5A0]" />
              Atualizado: {format(new Date(), "HH:mm 'hs'", { locale: ptBR })}
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-[#003833] hover:bg-[#004841] text-[#00F5A0] border border-[#00F5A0]/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              title="Atualizar dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>


      {/* Cards Financeiros & Base Operacional */}
      <FinancialCards data={financialData} />

      {/* Seção de Gráficos de Desempenho e Meta */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna Principal (2 terços): Gráfico Horizontal Único */}
        <div className="lg:col-span-2 space-y-6">
          <MonthlyChart companyId={selectedCompany?.id} />
        </div>

        {/* Coluna Lateral (1 terça): Meta de Receita & Retenções Impostos */}
        <div className="flex flex-col gap-6">
          <RevenueGoalCard invoices={invoicesData} />
        </div>
      </div>

      {/* Faixas de Vencimento de Contas a Receber em Aberto (Aging Report) */}
      <AgingReceivablesCard data={receivablesData} />
    </div>
  );
}


