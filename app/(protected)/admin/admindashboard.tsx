"use client";

import FinancialCards from "@/components/dashboard/financialcards";
import MonthBirthday from "@/components/dashboard/monthbirthday";
import MonthlyChart from "@/components/dashboard/monthlychart";
import TaxInformations from "@/components/dashboard/taxinformation";
import { Professional } from "@/src/types/professional";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useCallback, useEffect, useState } from "react";

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [receivablesData, setReceivablesData] = useState<any | null>(null);
  const [financialData, setFinancialData] = useState({
    totalReceivable: 0,
    totalPayable: 0,
    monthlyRevenue: 0,
    adminFees: 0,
    totalClients: 0,
    totalProfessionals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [professionalData, setProfessionalData] = useState<Professional[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedCompanyId = localStorage.getItem("selectedCompanyId");

      const res = await fetch(`/api/dashboard?companyId=${savedCompanyId || ""}`);
      const data = await res.json();

      const professional = await fetch(`/api/birthday?companyId=${savedCompanyId || ""}`)
      const professionalData = await professional.json();

      setCompanies(data.companies || []);

      const currentCompany =
        savedCompanyId && data.companies
          ? data.companies.find((c: any) => c.id === savedCompanyId)
          : data.companies?.[0];

      if (currentCompany) {
        setSelectedCompany(currentCompany);
        setFinancialData(data.financialData);
        setReceivablesData(data.receivables);
        setProfessionalData(professionalData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Visão geral financeira
            {selectedCompany && ` - ${selectedCompany.name}`}
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Atualizado em{" "}
          {format(new Date(), "d 'de' MMMM, HH:mm", { locale: ptBR })}
        </div>
      </div>

      <FinancialCards data={financialData} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/*<RecentInvoices invoices={recentInvoices} />*/}
          <MonthlyChart companyId={selectedCompany?.id} />
        </div>
        <div className="flex flex-col gap-4">
          <TaxInformations data={receivablesData}></TaxInformations>
          <MonthBirthday data={professionalData || []}></MonthBirthday>
        </div>
      </div>
    </div>
  );
}
