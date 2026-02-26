"use client"

import React, { useEffect, useState, useCallback } from "react"
import ReceivableForm from "@/components/receivable/receivableform"
import HistoryDialog from "@/components/receivable/historydialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, History, Search, Lock, RotateCcw, ArrowDownFromLine } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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
    await fetch(`/api/accountsreceivable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    })

    setShowPaymentForm(false);
    setSelectedReceivable(null);
    await loadReceivable();
  };

  const handleInstallmentDelete = async (installmentId: String) =>{
    try {
      await fetch(`/api/accountsreceivable/installments/${installmentId}`, {
        method: "DELETE",
      })

      loadReceivable()
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error)
    }
  }

  const filteredAccounts = receivables.filter(acc => {
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
      "Valor Pago (R$)",
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
        <div className="relative flex-1 min-w-[250px] ">
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
            className="w-[150px]"
          />
          <span className="text-slate-500">até</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
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
          const totalPaid = acc.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0
          const remainingAmount = acc.amount - totalPaid
          const status = statusConfig[acc.status] || { label: "Desconhecido", color: "bg-gray-200" }

          return (
            <Card key={acc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="grid grid-cols-[75%_25%]">
                    <p className="text-md text-slate-500">
                      NFS-e: {acc.document} - Emissão: {formatDate(acc.due_date)}
                    </p>
                    <div className="flex items-center justify-center">
                      <Badge className={`min-w-[100px] text-center ${status.color}`}>{status.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">{acc.client_name}</h3>
                  </div>
                  <div className="text-sm mt-2 border-t pt-3">
                    <span>Total: R$ {toBRLDecimal(acc.amount.toFixed(2))}</span>
                    <span className="mx-2">|</span>
                    <span className="text-green-600">Recebido: R$ {toBRLDecimal(totalPaid.toFixed(2))}</span>
                    <span className="mx-2">|</span>
                    <span className="text-red-600">Restante: R$ {toBRLDecimal(remainingAmount.toFixed(2))}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="grid grid-rows-2 gap-4">
                    <Button
                      size="sm"
                      onClick={() => handleOpenPayment(acc)}
                      disabled={acc.status === "paid"} // desativa quando está pago
                      className={acc.status === "paid" ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {acc.status === "paid" ? (
                        <Lock className="w-4 h-4 mr-1" />
                      ) : (
                        <DollarSign className="w-4 h-4 mr-1" />
                      )}
                      Receber
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenHistory(acc)}
                    >
                      <History className="w-4 h-4 mr-1" /> Histórico
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
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
              remainingAmount={selectedReceivable.amount - (selectedReceivable.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0)}
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
        Exportar Excel
      </Button>
    </div>
  )
}
