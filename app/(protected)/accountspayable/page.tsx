"use client";

import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import { PaymentForm } from "@/components/payable/paymentform";
import { HistoryDialog } from "@/components/payable/historydialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, RotateCcw, ArrowDownFromLine, TrendingDown, Banknote } from "lucide-react";
import { format } from "date-fns";
import { AccountsPayable } from "@/src/types/payment";
import { formatDate, toBRLDecimal } from "@/lib/utils";
import { PayableItem } from "@/components/payable/payableitem";
import { AccountsPayableStatus } from "@/src/types/enums";
import { useRole } from "@/hooks/useRole";

export default function AccountsPayablePage() {
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<AccountsPayable | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inputValue, setInputValue] = useState("");
  const deferredSearch = useDeferredValue(inputValue);
  const role = useRole();

  const statusConfig = useMemo(
    () => ({
      pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
      partially_paid: { label: "Parcialmente Pago", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
      paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
      overdue: { label: "Vencido", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
      cancelled: { label: "Cancelado", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
    }),
    []
  );

  const loadPayable = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      setSelectedCompanyId(companyId);

      if (!companyId) {
        setPayables([]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/accountspayable?companyId=${companyId}`);
      const data = await res.json();

      const resPayables: AccountsPayable[] = data.accounts;

      const receivablesWithName: AccountsPayable[] = resPayables.map((r: AccountsPayable) => ({
        ...r,
        professional_name: r.professional?.name || "Profissional não encontrado",
        client_name: r.invoice?.client?.name || "Cliente não encontrado",
      }));

      setPayables(receivablesWithName);
    } catch (err) {
      console.error("Erro ao carregar contas a pagar:", err);
      setPayables([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayable();
  }, [loadPayable]);

  const handleOpenPayment = useCallback((payable: AccountsPayable) => {
    setSelectedPayable(payable);
    setShowPaymentForm(true);
  }, []);

  const handleOpenHistory = useCallback((payable: AccountsPayable) => {
    setSelectedPayable(payable);
    setShowHistory(true);
  }, []);

  const handleSavePayment = async (paymentData: Omit<any, "id">) => {
    const createdInstallment = await fetch(`/api/accountspayable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    }).then((r) => r.json());

    setPayables((prev) =>
      prev.map((p) => {
        if (p.id !== paymentData.accounts_payable_id) return p;

        const updatedInstallments = [...(p.installments || []), createdInstallment];

        const totalPaid = updatedInstallments.reduce((sum, i) => sum + i.amount_paid, 0);

        const totalDiscount = updatedInstallments.reduce(
          (sum, i) => sum + (i.discount || 0),
          0
        );

        let newStatus: AccountsPayableStatus = p.status;

        if (totalPaid === 0) newStatus = "pending";
        else if (totalPaid + totalDiscount < p.amount) newStatus = "partially_paid";
        else newStatus = "paid";

        return {
          ...p,
          installments: updatedInstallments,
          status: newStatus,
        };
      })
    );

    setShowPaymentForm(false);
    setSelectedPayable(null);
  };

  const handleInstallmentDelete = async (installmentId: string) => {
    try {
      await fetch(`/api/accountspayable/installments/${installmentId}`, {
        method: "DELETE",
      });

      setPayables((prev) =>
        prev.map((p) => {
          if (!p.installments?.some((i) => i.id === installmentId)) return p;

          const updatedInstallments = p.installments.filter((i) => i.id !== installmentId);

          const totalPaid = updatedInstallments.reduce((sum, i) => sum + i.amount_paid, 0);

          const totalDiscount = updatedInstallments.reduce(
            (sum, i) => sum + (i.discount || 0),
            0
          );

          let newStatus: AccountsPayableStatus = p.status;

          if (totalPaid === 0) newStatus = "pending";
          else if (totalPaid + totalDiscount < p.amount) newStatus = "partially_paid";
          else newStatus = "paid";

          return {
            ...p,
            installments: updatedInstallments,
            status: newStatus,
          };
        })
      );
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error);
    }
  };

  const normalizedPayables = useMemo(() => {
    return payables.map((acc) => {
      const dateStr = typeof acc.due_date === "string" 
        ? acc.due_date.split("T")[0] 
        : new Date(acc.due_date).toISOString().split("T")[0];

      return {
        ...acc,
        _search: [acc.professional_name, acc.document, acc.client_name, statusConfig[acc.status]?.label]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        _amountStr: acc.amount.toFixed(2),
        _dateStr: dateStr,
      };
    });
  }, [payables, statusConfig]);

  const filteredAccounts = useMemo(() => {
    const term = inputValue.toLowerCase().trim();

    return normalizedPayables.filter((acc) => {
      const matchesSearch =
        !term || acc._search.includes(term) || acc._amountStr.includes(term.replace(",", "."));

      const matchesDate = (!startDate || acc._dateStr >= startDate) && (!endDate || acc._dateStr <= endDate);

      return matchesSearch && matchesDate;
    });
  }, [normalizedPayables, inputValue, startDate, endDate]);

  const handleClear = () => {
    setInputValue("");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const exportToCSV = () => {
    if (filteredAccounts.length === 0) {
      alert("Não há registros para exportar.");
      return;
    }

    const headers = [
      "Profissional",
      "Documento (NFS-e)",
      "Data de Emissao",
      "Status da Conta",
      "Parcela N",
      "Data de Baixa (Parcela)",
      "Valor Pago (R$)",
      "Desconto (R$)",
      "Observações",
      "Tomador do Serviço",
    ];

    const rows = filteredAccounts.flatMap((acc) => {
      if (!acc.installments || acc.installments.length === 0) {
        return [
          [
            acc.professional_name,
            acc.document,
            formatDate(acc.due_date),
            acc.status,
            "",
            "",
            toBRLDecimal(acc.amount.toFixed(2)),
            "",
            "",
            acc.client_name,
          ].join(";"),
        ];
      }

      return acc.installments.map((inst, index) => {
        return [
          acc.professional_name,
          acc.document,
          formatDate(acc.due_date),
          acc.status,
          index + 1,
          formatDate(inst.payment_date),
          toBRLDecimal(inst.amount_paid?.toFixed(2) || "0.00"),
          toBRLDecimal((inst.discount || 0).toFixed(2)),
          inst.observations || "",
          acc.client_name,
        ].join(";");
      });
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Contas_a_Pagar_${format(new Date(), "ddMMyyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);
    return () => clearTimeout(delay);
  }, [inputValue]);

  const calculateAccountData = useCallback((acc: AccountsPayable) => {
    const receivable = acc.invoice?.accounts_receivable;

    const clientPaid =
      receivable?.installments?.reduce(
        (sum, i) => sum + i.amount_paid + (i.discount || 0),
        0
      ) || 0;

    const receivableAmount = receivable?.amount || 0;

    let receivableStatus: "pending" | "partially_paid" | "paid" = "pending";

    if (clientPaid === 0) receivableStatus = "pending";
    else if (clientPaid < receivableAmount) receivableStatus = "partially_paid";
    else receivableStatus = "paid";

    const totalPaid = acc.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0;

    const totalDiscount = acc.installments?.reduce((sum, i) => sum + (i.discount || 0), 0) || 0;

    const round = (v: number) => Number(v.toFixed(2));

    const remainingAmount = round(round(acc.amount) - round(totalPaid) - round(totalDiscount));

    return {
      receivableStatus,
      totalPaid,
      totalDiscount,
      remainingAmount,
    };
  }, []);

  const calculatedMap = useMemo(() => {
    const map = new Map();

    filteredAccounts.forEach((acc) => {
      map.set(acc.id, calculateAccountData(acc));
    });

    return map;
  }, [filteredAccounts, calculateAccountData]);

  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert className="bg-card border-border text-foreground rounded-2xl">
          <AlertDescription className="text-xs font-semibold text-muted-foreground">
            Por favor, selecione uma empresa no menu lateral para gerenciar as contas a pagar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Financeiro & Repasses Médicos
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <TrendingDown className="w-6 h-6 text-primary" />
              Contas a Pagar (Repasses a Profissionais)
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie a liquidação de repasses aos médicos com desconto automático da taxa de administração
            </p>
          </div>

          <Button
            onClick={exportToCSV}
            className="bg-cyan-800/80 hover:bg-cyan-800 text-white hover:scale-105 transition-all duration-200 border-border rounded-xl text-xs font-semibold"
          >
            <ArrowDownFromLine className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
          <Input
            placeholder="Buscar por profissional, valor, status ou documento..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-10 bg-banner-via border-border text-white placeholder:text-muted-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 bg-banner-via border-border text-white rounded-xl text-xs"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 bg-banner-via border-border text-white rounded-xl text-xs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border rounded-xl text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Limpar Filtros
        </Button>
      </div>

      {/* Payable Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-xs font-medium bg-card border border-border rounded-2xl">
            <div className="animate-pulse">Carregando contas a pagar...</div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl p-6">
            <Banknote className="w-12 h-12 text-primary opacity-70 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhuma conta a pagar encontrada</h3>
            <p className="text-xs text-muted-foreground mt-1">Ajuste os filtros ou selecione outra empresa.</p>
          </div>
        ) : (
          filteredAccounts.map((acc) => (
            <PayableItem
              key={acc.id}
              acc={acc}
              calculated={calculatedMap.get(acc.id)}
              statusConfig={statusConfig}
              role={role}
              onOpenPayment={handleOpenPayment}
              onOpenHistory={handleOpenHistory}
            />
          ))
        )}
      </div>

      {/* Payment Form Dialog */}
      {showPaymentForm && selectedPayable && (
        <Dialog open={showPaymentForm} onOpenChange={() => setShowPaymentForm(false)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
            <DialogHeader className="border-b border-border pb-3 shrink-0">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                Registrar Pagamento - NFS-e #{selectedPayable.document}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <PaymentForm
                payable={selectedPayable}
                remainingAmount={
                  selectedPayable.amount -
                  (selectedPayable.installments?.reduce(
                    (sum, i) => sum + i.amount_paid + (i.discount || 0),
                    0
                  ) || 0)
                }
                onSave={handleSavePayment}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* History Dialog */}
      {showHistory && selectedPayable && (
        <HistoryDialog
          payable={selectedPayable}
          installments={selectedPayable.installments || []}
          onCancel={() => setShowHistory(false)}
          onDelete={handleInstallmentDelete}
          role={role}
        />
      )}
    </div>
  );
}
