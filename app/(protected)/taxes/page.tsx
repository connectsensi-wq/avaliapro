"use client";

import React, { useState, useEffect, useCallback } from "react";
import TaxProjection from "@/components/taxes/taxprojection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Percent } from "lucide-react";

export default function TaxesPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      setSelectedCompanyId(companyId);

      if (!companyId) {
        setIsLoading(false);
        return;
      }

      // Fetch Empresa
      const companyRes = await fetch(`/api/companies/${companyId}`);
      if (companyRes.ok) {
        const compData = await companyRes.json();
        setCompanyName(compData.name || compData.fantasy_name || "Empresa Ativa");
      }

      // Fetch dados de impostos (/api/taxes)
      // Traz PaymentInstallments (com accounts_receivable -> invoice -> total_amount & retentions) e Invoices
      const taxRes = await fetch(`/api/taxes?companyId=${companyId}`);
      if (taxRes.ok) {
        const taxData = await taxRes.json();
        setInstallments(taxData.installments || []);
        setInvoices(taxData.invoices || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados fiscais:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert className="bg-card border-border text-foreground rounded-2xl">
          <AlertDescription className="text-xs font-semibold text-muted-foreground">
            Por favor, selecione uma empresa no menu lateral para visualizar a projeção de impostos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card border border-none shadow-xl rounded-2xl space-y-2 max-w-7xl mx-auto">
        <Percent className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="font-semibold text-muted-foreground text-sm">Carregando projeção de impostos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <TaxProjection
        invoices={invoices}
        installments={installments}
        companyName={companyName}
      />
    </div>
  );
}
