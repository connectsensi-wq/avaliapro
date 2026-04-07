"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PaymentForm } from "@/components/payable/paymentform";
import { HistoryDialog } from "@/components/payable/historydialog";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, RotateCcw, ArrowDownFromLine } from "lucide-react";
import { format } from "date-fns";
import { AccountsPayable } from "@/src/types/payment";
import { formatDate, toBRLDecimal } from "@/lib/utils";
import { PayableItem } from "@/components/payable/payableitem";
import { useDeferredValue } from "react";
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

  const statusConfig = useMemo(() => ({
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    partially_paid: { label: "Parcialmente Pago", color: "bg-blue-100 text-blue-800" },
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    overdue: { label: "Vencido", color: "bg-red-100 text-red-800" },
    cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
  }), []);

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
      const data = await res.json(); // { accounts }

      const resPayables: AccountsPayable[] = data.accounts;

      // Mapear professional_name e client_name usando o relation já incluído no Prisma
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

  useEffect(() => { loadPayable(); }, [loadPayable]);

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
    }).then(r => r.json());
  
    setPayables(prev =>
      prev.map(p => {
        if (p.id !== paymentData.accounts_payable_id) return p;
      
        const updatedInstallments = [...(p.installments || []), createdInstallment];
      
        const totalPaid = updatedInstallments.reduce(
          (sum, i) => sum + i.amount_paid,
          0
        );
      
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

      setPayables(prev =>
        prev.map(p => {
          if (!p.installments?.some(i => i.id === installmentId)) return p;

          const updatedInstallments = p.installments.filter(i => i.id !== installmentId);

          const totalPaid = updatedInstallments.reduce(
            (sum, i) => sum + i.amount_paid,
            0
          );

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
    return payables.map(acc => ({
      ...acc,
      _search: [
        acc.professional_name,
        acc.document,
        statusConfig[acc.status]?.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),

      _amountStr: acc.amount.toFixed(2),
      _dueDate: new Date(acc.due_date),
    }));
  }, [payables, statusConfig]);

  const filteredAccounts = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim();

    const start = startDate ? new Date(startDate + "T00:00:00Z") : null;
    const end = endDate ? new Date(endDate + "T23:59:59Z") : null;

    return normalizedPayables.filter(acc => {
      const matchesSearch =
        !term ||
        acc._search.includes(term) ||
        acc._amountStr.includes(term.replace(",", "."));

      const matchesDate =
        (!start || acc._dueDate >= start) &&
        (!end || acc._dueDate <= end);

      return matchesSearch && matchesDate;
    });
  }, [normalizedPayables, searchTerm, startDate, endDate]);

  const handleClear = () => {
    setSearchTerm("");
    setInputValue("");
    setStartDate("");
    setEndDate("");
  }

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
      "Tomador do Serviço"
    ];

    // "Achata" as contas com suas parcelas
    const rows = filteredAccounts.flatMap((acc) => {
      // Caso não tenha parcelas, ainda exporta uma linha única da conta
      if (!acc.installments || acc.installments.length === 0) {
        return [
          [
            acc.professional_name,
            acc.document,
            formatDate(acc.due_date),
            acc.status,
            "", // sem parcela
            "",
            toBRLDecimal(acc.amount.toFixed(2)),
            "", // desconto
            "", // observações
            acc.client_name,
          ].join(";"),
        ];
      }

      // Se houver parcelas, cria uma linha por parcela
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
          acc.client_name
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
    const delay = setTimeout(() => {setSearchTerm(inputValue)}, 300);
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
    
    const totalPaid =
      acc.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0;
    
    const totalDiscount =
      acc.installments?.reduce((sum, i) => sum + (i.discount || 0), 0) || 0;
    
    const round = (v: number) => Number(v.toFixed(2));
    
    const remainingAmount = round(
      round(acc.amount) - round(totalPaid) - round(totalDiscount)
    );
  
    return {
      receivableStatus,
      totalPaid,
      totalDiscount,
      remainingAmount,
    };
  }, []);

  const calculatedMap = useMemo(() => {
    const map = new Map();
  
    filteredAccounts.forEach(acc => {
      map.set(acc.id, calculateAccountData(acc));
    });
  
    return map;
  }, [filteredAccounts, calculateAccountData]);

  return (
    <div>
      {!selectedCompanyId ? (
          <Alert>
            <AlertDescription>
              Por favor, selecione uma empresa no menu lateral para gerenciar as contas a pagar.
            </AlertDescription>
          </Alert>
      ) : (
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Contas a Pagar</h1>
              <p className="text-slate-600 mt-1">Gerencie os pagamentos aos profissionais</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Campo de busca */}
            <div className="relative flex-1 min-w-62.5">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por profissional, valor, status ou documento..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro entre datas */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-37.5"
              />
              <span className="text-slate-500">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-37.5"
              />
            </div>

            {/* Botão de limpar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Filtros
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? <p className="text-slate-500 animate-pulse">Carregando contas...</p> 
              : filteredAccounts.map(acc => (
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
            }
          </div>
          
          {showPaymentForm && selectedPayable && (
          <Dialog open={showPaymentForm} onOpenChange={() => setShowPaymentForm(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Pagamento - NFS-e {selectedPayable.document}</DialogTitle>
              </DialogHeader>
                <PaymentForm
                  payable={selectedPayable}
                  remainingAmount={selectedPayable.amount - (
                    selectedPayable.installments?.reduce(
                      (sum, i) => sum + i.amount_paid + (i.discount || 0),
                      0
                    ) || 0
                  )}
                  onSave={handleSavePayment}
                  onCancel={() => setShowPaymentForm(false)}
                />
              </DialogContent>
          </Dialog>
          )}

          {showHistory && selectedPayable && (
            <HistoryDialog
              payable={selectedPayable}
              installments={selectedPayable.installments || []}
              onCancel={() => setShowHistory(false)}
              onDelete={handleInstallmentDelete}
              role={role}
            />
          )}
          <Button
            variant="default"
            size="sm"
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ArrowDownFromLine className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      )}
    </div>
  );
}
