"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReceivableForm from "@/components/receivable/receivableform";
import HistoryDialog from "@/components/receivable/historydialog";
import ReceivableItem from "@/components/receivable/receivableitem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, RotateCcw, ArrowDownFromLine, TrendingUp, Wallet } from "lucide-react";
import { format } from "date-fns";
import { AccountsReceivable } from "@/src/types/payment";
import { Client } from "@/src/types/client";
import { AccountsReceivableStatus } from "@/src/types/enums";
import { formatDate, toBRLDecimal } from "@/lib/utils";
import { useDeferredValue } from "react";

export default function AccountsReceivablePage() {
  const [receivables, setReceivable] = useState<AccountsReceivable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<AccountsReceivable | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inputValue, setInputValue] = useState("");

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

  const loadReceivable = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      setSelectedCompanyId(companyId);

      if (!companyId) {
        setReceivable([]);
        setClients([]);
        setIsLoading(false);
        return;
      }

      const [resReceivable, resClients] = await Promise.all([
        fetch(`/api/accountsreceivable?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/clients?companyId=${companyId}`).then((r) => r.json()),
      ]);

      const clientsData: Client[] = resClients;

      const receivablesWithName: AccountsReceivable[] = resReceivable.map((r: AccountsReceivable) => {
        const client = clientsData.find((c) => c.id === r.client_id);
        return {
          ...r,
          client_name: client?.name || "Cliente não encontrado",
        };
      });

      setReceivable(receivablesWithName);
      setClients(clientsData);
    } catch (error) {
      console.error("Erro ao carregar contas e clientes:", error);
      setReceivable([]);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceivable();
  }, [loadReceivable]);

  const handleOpenPayment = (receivable: AccountsReceivable) => {
    setSelectedReceivable(receivable);
    setShowPaymentForm(true);
  };

  const handleOpenHistory = (receivable: AccountsReceivable) => {
    setSelectedReceivable(receivable);
    setShowHistory(true);
  };

  const handleSavePayment = async (paymentData: Omit<any, "id">) => {
    const createdInstallment = await fetch(`/api/accountsreceivable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    }).then((r) => r.json());

    setReceivable((prev) =>
      prev.map((r) => {
        if (r.id !== paymentData.accounts_receivable_id) return r;

        const updatedInstallments = [...(r.installments || []), createdInstallment];
        const totalPaid = updatedInstallments.reduce((sum, i) => sum + i.amount_paid + (i.discount || 0), 0);
        let newStatus = r.status;

        if (totalPaid === 0) newStatus = "pending";
        else if (totalPaid < r.amount) newStatus = "partially_paid";
        else newStatus = "paid";

        return {
          ...r,
          installments: updatedInstallments,
          status: newStatus,
        };
      })
    );

    setShowPaymentForm(false);
    setSelectedReceivable(null);
  };

  const handleInstallmentDelete = async (installmentId: string) => {
    try {
      await fetch(`/api/accountsreceivable/installments/${installmentId}`, {
        method: "DELETE",
      });

      setReceivable((prev) =>
        prev.map((r) => {
          if (!r.installments?.some((i) => i.id === installmentId)) return r;

          const updatedInstallments = r.installments.filter((i) => i.id !== installmentId);
          const totalPaid = updatedInstallments.reduce((sum, i) => sum + i.amount_paid + (i.discount || 0), 0);
          let newStatus: AccountsReceivableStatus = "pending";

          if (totalPaid === 0) newStatus = "pending";
          else if (totalPaid < r.amount) newStatus = "partially_paid";
          else newStatus = "paid";

          return {
            ...r,
            installments: updatedInstallments,
            status: newStatus,
          };
        })
      );
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error);
    }
  };

  const processedAccounts = React.useMemo(() => {
    return receivables.map((acc) => {
      const dateStr = typeof acc.due_date === "string"
        ? acc.due_date.split("T")[0]
        : new Date(acc.due_date).toISOString().split("T")[0];

      return {
        ...acc,
        _search: [acc.client_name, acc.document, statusConfig[acc.status]?.label]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        _amountStr: acc.amount.toFixed(2),
        _dateStr: dateStr,
      };
    });
  }, [receivables, statusConfig]);

  const filteredAccounts = useMemo(() => {
    const term = inputValue.toLowerCase().trim();

    return processedAccounts.filter((acc) => {
      const matchesSearch =
        !term || acc._search.includes(term) || acc._amountStr.includes(term.replace(",", "."));

      const matchesDate = (!startDate || acc._dateStr >= startDate) && (!endDate || acc._dateStr <= endDate);

      return matchesSearch && matchesDate;
    });
  }, [processedAccounts, inputValue, startDate, endDate]);

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
      "Cliente",
      "Documento (NFS-e)",
      "Data de Emissão",
      "Status da Conta",
      "Parcela N",
      "Data de Baixa (Parcela)",
      "Valor Recebido (R$)",
      "Desconto (R$)",
      "Observações",
    ];

    const rows = filteredAccounts.flatMap((acc) => {
      if (!acc.installments || acc.installments.length === 0) {
        return [
          [
            acc.client_name,
            acc.document,
            formatDate(acc.due_date),
            acc.status,
            "",
            "",
            toBRLDecimal(acc.amount.toFixed(2)),
            "",
            "",
          ].join(";"),
        ];
      }

      return acc.installments.map((inst, index) => {
        return [
          acc.client_name,
          acc.document,
          formatDate(acc.due_date),
          acc.status,
          index + 1,
          formatDate(inst.payment_date),
          toBRLDecimal(inst.amount_paid?.toFixed(2) || "0.00"),
          toBRLDecimal((inst.discount || 0).toFixed(2)),
          inst.observations || "",
        ].join(";");
      });
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Contas_a_Receber_${format(new Date(), "ddMMyyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const accountsWithStatus = useMemo(() => {
    return filteredAccounts.map((acc) => ({
      acc,
      status: statusConfig[acc.status] || {
        label: "Desconhecido",
        color: "bg-secondary text-muted-foreground",
      },
    }));
  }, [filteredAccounts, statusConfig]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);

    return () => clearTimeout(delay);
  }, [inputValue]);

  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert className="bg-card border-border text-foreground rounded-2xl">
          <AlertDescription className="text-xs font-semibold text-muted-foreground">
            Por favor, selecione uma empresa no menu lateral para gerenciar as contas a receber.
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
              Financeiro & Faturamento Hospitalar
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-primary" />
              Contas a Receber (Faturamento de Clientes)
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Acompanhe a liquidação de NFS-e emitidas para hospitais e clínicas contratantes
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
            placeholder="Buscar por cliente, valor, status ou documento..."
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

      {/* Receivable Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-xs font-medium bg-card border border-border rounded-2xl">
            <div className="animate-pulse">Carregando contas a receber...</div>
          </div>
        ) : accountsWithStatus.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl p-6">
            <Wallet className="w-12 h-12 text-primary opacity-70 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhuma conta a receber encontrada</h3>
            <p className="text-xs text-muted-foreground mt-1">Ajuste os filtros ou emita uma nova NFS-e.</p>
          </div>
        ) : (
          accountsWithStatus.map(({ acc, status }) => (
            <ReceivableItem
              key={acc.id}
              acc={acc}
              status={status}
              onOpenPayment={handleOpenPayment}
              onOpenHistory={handleOpenHistory}
            />
          ))
        )}
      </div>

      {/* Payment Form Dialog */}
      {showPaymentForm && selectedReceivable && (
        <Dialog open={showPaymentForm} onOpenChange={() => setShowPaymentForm(false)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
            <DialogHeader className="border-b border-border pb-3 shrink-0">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Registrar Recebimento - NF #{selectedReceivable.document}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <ReceivableForm
                receivable={selectedReceivable}
                remainingAmount={
                  selectedReceivable.amount -
                  (selectedReceivable.installments?.reduce(
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
      {showHistory && selectedReceivable && (
        <HistoryDialog
          receivable={selectedReceivable}
          installments={selectedReceivable.installments || []}
          onCancel={() => setShowHistory(false)}
          onDelete={handleInstallmentDelete}
        />
      )}
    </div>
  );
}
