"use client"

import React, { useEffect, useState, useCallback } from "react";
import ReceivableForm from "@/components/receivable/receivableform";
import HistoryDialog from "@/components/receivable/historydialog";
import ReceivableItem from "@/components/receivable/receivableitem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, History, Search, Lock, RotateCcw, ArrowDownFromLine } from "lucide-react";
import { format } from "date-fns";
import { AccountsReceivable } from "@/src/types/payment"
import { Client } from "@/src/types/client"
import { AccountsReceivableStatus } from "@/src/types/enums"
import { formatDate, toBRLDecimal } from "@/lib/utils"

export default function AccountsReceivablePage() {
  const [receivables, setReceivable] = useState<AccountsReceivable[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<AccountsReceivable | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const statusConfig: Record<AccountsReceivableStatus, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    partially_paid: { label: "Parcialmente Pago", color: "bg-blue-100 text-blue-800" },
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    overdue: { label: "Vencido", color: "bg-red-100 text-red-800" },
    cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
  }

  const loadReceivable = useCallback(async () => {
    setIsLoading(true)
    try {
      const companyId = localStorage.getItem("selectedCompanyId")
      setSelectedCompanyId(companyId)

      if (!companyId) {
        setReceivable([])
        setClients([])
        setIsLoading(false)
        return
      }

      // Fetch contas e clientes
      const [resReceivable, resClients] = await Promise.all([
        fetch(`/api/accountsreceivable?companyId=${companyId}`).then(r => r.json()),
        fetch(`/api/clients?companyId=${companyId}`).then(r => r.json())
      ])

      const clientsData: Client[] = resClients

      // Mapear client_name dentro de cada receivable
      const receivablesWithName: AccountsReceivable[] = resReceivable.map((r: AccountsReceivable) => {
        const client = clientsData.find(c => c.id === r.client_id)
        return {
          ...r,
          client_name: client?.name || "Cliente não encontrado",
        }
      })

      setReceivable(receivablesWithName)
      setClients(clientsData)
    } catch (error) {
      console.error("Erro ao carregar contas e clientes:", error)
      setReceivable([])
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadReceivable() }, [loadReceivable])

  const handleOpenPayment = (receivable: AccountsReceivable) => {
    setSelectedReceivable(receivable)
    setShowPaymentForm(true)
  }

  const handleOpenHistory = (receivable: AccountsReceivable) => {
    setSelectedReceivable(receivable)
    setShowHistory(true)
  }

  const handleSavePayment = async (paymentData: Omit<any, "id">) => {
    const createdInstallment = await fetch(`/api/accountsreceivable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    }).then(r => r.json());

    setReceivable(prev =>
      prev.map(r => {
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

  const handleInstallmentDelete = async (installmentId: string) =>{
    try {
      await fetch(`/api/accountsreceivable/installments/${installmentId}`, {
        method: "DELETE",
      })

      setReceivable(prev =>
        prev.map(r => {
          if (!r.installments?.some(i => i.id === installmentId)) return r;
        
          const updatedInstallments = r.installments.filter(i => i.id !== installmentId);
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
      console.error("Erro ao deletar pagamento:", error)
    }
  }

  const filteredAccounts = React.useMemo(() => {
    return receivables.filter(acc => {
      const term = searchTerm.toLowerCase();
      const dueDate = new Date(acc.due_date);
    
      const matchesSearch =
        acc.client_name?.toLowerCase().includes(term) ||
        acc.document?.includes(term) ||
        acc.amount.toFixed(2).includes(term.replace(",", ".")) ||
        statusConfig[acc.status]?.label.toLowerCase().includes(term);
    
      const start = startDate ? new Date(startDate + "T00:00:00Z") : null;
      const end = endDate ? new Date(endDate + "T23:59:59Z") : null;
    
      const matchesDate =
        (!start || dueDate >= start) &&
        (!end || dueDate <= end);
    
      return matchesSearch && matchesDate;
    });
  }, [receivables, searchTerm, startDate, endDate]);

  const handleClear = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  }

  if (!selectedCompanyId) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>
            Por favor, selecione uma empresa no menu lateral para gerenciar as contas a receber.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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
      "Tomador do Serviço"
    ];

      // "Achata" as contas com suas parcelas
    const rows = filteredAccounts.flatMap((acc) => {
      // Caso não tenha parcelas, ainda exporta uma linha única da conta
      if (!acc.installments || acc.installments.length === 0) {
        return [
          [
            acc.client_name,
            acc.document,
            formatDate(acc.due_date),
            acc.status,
            "", // sem parcela
            "",
            toBRLDecimal(acc.amount.toFixed(2)),
            "", // desconto
            ""  // observações
          ].join(";"),
        ];
      }

      // Se houver parcelas, cria uma linha por parcela
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
          inst.observations || ""
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

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contas a Receber</h1>
          <p className="text-slate-600 mt-1">Gerencie os recebimentos da empresa</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-62.5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar por cliente, valor, status ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        {isLoading ? <p>Carregando...</p> : filteredAccounts.map(acc => {
          const status = statusConfig[acc.status] || { label: "Desconhecido", color: "bg-gray-200" }
           return (
            <ReceivableItem
                key={acc.id}
                acc={acc}
                status={status}
                onOpenPayment={handleOpenPayment}
                onOpenHistory={handleOpenHistory}
              />
            );
        })}
      </div>

      {showPaymentForm && selectedReceivable && (
        <Dialog open={showPaymentForm} onOpenChange={() => setShowPaymentForm(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Recebimento - NF {selectedReceivable.document}</DialogTitle>
            </DialogHeader>
            <ReceivableForm
              receivable={selectedReceivable}
              remainingAmount={selectedReceivable.amount - (
                selectedReceivable.installments?.reduce(
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

      {showHistory && selectedReceivable && (
        <HistoryDialog
          receivable={selectedReceivable}
          installments={selectedReceivable.installments || []}
          onCancel={() => setShowHistory(false)}
          onDelete={handleInstallmentDelete}
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
  )
}
