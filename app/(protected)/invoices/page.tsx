"use client";

import InvoiceDetails from "@/components/invoices/invoicedetails";
import InvoiceFilters from "@/components/invoices/invoicefilters";
import InvoiceForm from "@/components/invoices/invoiceform";
import InvoicePrintMulti from "@/components/invoices/invoiceprint";
import StatusUpdater from "@/components/invoices/statusupdater";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, toBRLDecimal } from "@/lib/utils";
import { Client } from "@/src/types/client";
import { Company } from "@/src/types/company";
import { Service } from "@/src/types/entities";
import { Invoice, InvoiceServiceItem } from "@/src/types/invoice";
import { Professional } from "@/src/types/professional";
import { ArrowDownFromLine, Edit, FileText, Lock, Plus } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");

      if (companyId) {
        setSelectedCompanyId(companyId);

        // Dispara todas as requisições em paralelo
        const [professionalsData, servicesData, companyData, invoicesData, clientsData,] =
          await Promise.all([
            fetch(`/api/invoice/professionals?companyId=${companyId}`).then(res => res.json()),
            fetch(`/api/services`).then(res => res.json()),
            fetch(`/api/companies`).then(res => res.json()),
            fetch(`/api/invoice?companyId=${companyId}`).then(res => res.json()),
            fetch(`/api/invoice/clients?companyId=${companyId}`).then(res => res.json())
          ]);
        
        // filtra apenas a empresa da sessão
        const companyFiltered = (companyData as Company[]).find(c => c.id === companyId);
        
        // Ordena invoices por número da nota em ordem decrescente (convertendo string -> número)
        const sortedInvoices = (invoicesData as Invoice[]).sort(
          (a, b) => Number(b.invoice_number) - Number(a.invoice_number)
        );

        // Atualiza estados
        setInvoices(invoicesData);
        setFilteredInvoices(invoicesData);
        setClients(clientsData as Client[]);
        setProfessionals(professionalsData as Professional[]);
        setServices(servicesData as Service[]);
        setCompany(companyFiltered as Company);
      } else {
        // Se não tiver companyId no localStorage, limpa estados
        setInvoices([]);
        setFilteredInvoices([]);
        setClients([]);
        setProfessionals([]);
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeFilters) {
    handleFilter(activeFilters); // <<< reaplica após recarregar invoices
    }
  }, [invoices]);

  const handleFilter = useCallback((filters: any) => {
    setActiveFilters(filters);
    let filtered = [...invoices];

    const normalizeDate = (dateString: string) => {
      const d = new Date(dateString);
      d.setHours(0, 0, 0, 0); // zera hora
      return d;
    };

    if (filters.invoice_number) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(filters.invoice_number.toLowerCase())
      );
    }
    if (filters.client_name) {
      filtered = filtered.filter(invoice =>
        invoice?.client?.name.toLowerCase().includes(filters.client_name.toLowerCase())
      );
    }
    if (filters.start_date) {
      const start = normalizeDate(filters.start_date);
      filtered = filtered.filter(invoice => normalizeDate(invoice.issue_date) >= start);
    }
    if (filters.end_date) {
      const end = normalizeDate(filters.end_date);
      filtered = filtered.filter(invoice => normalizeDate(invoice.issue_date) <= end);
    }
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }
    if (filters.total_amount) {
      filtered = filtered.filter(invoice => invoice.total_amount === filters.total_amount);
    }

    setFilteredInvoices(filtered);
  }, [invoices]);

  // POST/PUT - criar novo
  const handleSave = async (invoiceData: Partial<Invoice>) => {
    try {
      const dataToSave = { 
        ...invoiceData, companyId: selectedCompanyId, 
      };
      console.log(selectedCompanyId)
      if (editingInvoice) {
        const res = await fetch(`/api/invoice/${editingInvoice.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Erro ao editar invoice");
        await loadData(); // recarrega lista

      } else {
        const res = await fetch(`/api/invoice`, {
          method: "POST",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Erro ao salvar invoice");
        await loadData(); // recarrega lista
      }

      // Criar ou atualizar contas a receber
      const totalRetentions = invoiceData.total_retentions || 0;
      let receivableAmount = (invoiceData.total_amount || 0) - totalRetentions;
      
      // Se o imposto for retido, subtraia o valor do ISS do valor a receber
      if (invoiceData.tax_retained) {
        receivableAmount -= (invoiceData.iss_amount || 0);
      }

      toast.success(`Nota Fiscal de serviço ${editingInvoice ? "atualizada" : "emitida"} com sucesso!`);
      setShowForm(false);
      setEditingInvoice(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };


  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {

      console.log("Dados recebido no handleStatusChange :", invoiceId);

      const res = await fetch(`/api/invoice/${invoiceId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Erro ao atualizar status");
      }

      await loadData(); // reaplica filtro
      
      toast.success("Status atualizado");
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error(String(error));
    }
  }

  // GET por ID - visualizar
  const handleView = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/invoice/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar invoice");
      const data: Invoice = await res.json();
      setSelectedInvoice(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleNew = () => {
    setEditingInvoice(null);
    setShowForm(true);
  };

  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>
            Por favor, selecione uma empresa no menu lateral para gerenciar as notas fiscais.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const exportToCSV = () => {
    if (!filteredInvoices.length) {
      toast.error("Nenhuma nota fiscal para exportar");
      return;
    }

    const headers = [
      "Número da NFS-e",
      "Cliente",
      "Data de Emissão",
      "Valor Total (R$)",
      "Status",
      "Iss",
      "Iss Retido?",
      "Pis Retido",
      "Cofins Retido",
      "Irpj Retido",
      "Csll Retido",
      "Inss Retido",
      "Outras Retenções",
      "Número Nfs-e Substitída",
      "Provém de um RPS",
      "Data do RPS",
      "Número do RPS",
      "Natureza da Operação",
      "Cód. Serviço",
      "Local do Serviço",
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoice_number || "",
      inv.client?.name || "",
      formatDate(inv.issue_date),
      inv.total_amount?.toFixed(2)?.replace(".", ",") || "0,00",
      inv.status || "",
      inv.iss_amount.toFixed(2)?.replace(".", ",") || "0,00",
      inv.tax_retained || "",
      inv.retentions?.pis_pasep.toFixed(2)?.replace(".", ",") || "0,00",
      inv.retentions?.cofins.toFixed(2)?.replace(".", ",") || "0,00",
      inv.retentions?.irpj.toFixed(2)?.replace(".", ",") || "0,00",
      inv.retentions?.csll.toFixed(2)?.replace(".", ",") || "0,00",
      inv.retentions?.inss.toFixed(2)?.replace(".", ",") || "0,00",
      inv.retentions?.other_retentions.toFixed(2)?.replace(".", ",") || "0,00",
      inv.substitute_number || "",
      inv.from_rps || "",
      inv.rps_date || "",
      inv.rps_number || "",
      inv.operation_nature,
      inv.service_code,
      inv.service_location,
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(r => r.join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "notas_fiscais.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notas Fiscais</h1>
          <p className="text-slate-600 mt-1">Gerencie as notas fiscais da empresa</p>
        </div>
        <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800" disabled={!selectedCompanyId}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota Fiscal
        </Button>
      </div>

      {/* Filtros */}
      <InvoiceFilters onFilter={handleFilter} />

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">Carregando notas fiscais...</div>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <InvoicePrintMulti 
                          invoice={invoice}
                          professionals={professionals}
                          company={company}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-slate-900">
                            Demonstrativo NFS-e {invoice.invoice_number}
                          </h4>
                          {invoice.locked && (
                            <Lock className="w-3 h-3 text-slate-400" aria-label="Nota fiscal bloqueada para edição pois possui recebimentos"/>
                          )}
                            <StatusUpdater
                              invoiceId={invoice.id}
                              currentStatus={invoice.status}
                              onStatusChange={handleStatusChange}
                              locked={invoice.locked}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                          <div><span className="font-medium">Data:</span> {formatDate(invoice.issue_date)}</div>
                          <div>
                            <span className="font-medium">Valor:</span>
                            {invoice.total_amount != null ? (
                              <span className="font-semibold text-slate-900 ml-1">R$ {toBRLDecimal(invoice.total_amount.toFixed(2))}</span>
                            ) : <span className="ml-1">-</span>}
                          </div>
                          <div><span className="font-medium">Participante:</span> {invoice.service_items?.length || 0}</div>
                        </div>
                        <div>
                            <div><span className="font-medium w-full">Cliente:</span> {invoice?.client?.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInvoice(invoice);
                          setShowForm(true);
                        }}
                        className="px-3"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma nota fiscal encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Button
        variant="default"
        size="sm"
        onClick={exportToCSV}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <ArrowDownFromLine className="w-4 h-4 mr-2" />
        Exportar Excel
      </Button>


      {/* Dialogs */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingInvoice(null); }}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={editingInvoice}
            clients={clients}
            professionals={professionals}
            services={services}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceDetails
              invoice={selectedInvoice}
              clients={clients}
              professionals={professionals}
              services={services}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
