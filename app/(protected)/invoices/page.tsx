"use client";

import InvoiceDetails from "@/components/invoices/invoicedetails";
import InvoiceFilters from "@/components/invoices/invoicefilters";
import InvoiceForm from "@/components/invoices/invoiceform";
import InvoiceItem from "@/components/invoices/invoiceitem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Client } from "@/src/types/client";
import { Company } from "@/src/types/company";
import { Service } from "@/src/types/entities";
import { InvoiceStatus } from "@/src/types/enums";
import { Invoice } from "@/src/types/invoice";
import { Professional } from "@/src/types/professional";
import { ArrowDownFromLine, Edit, FileText, Lock, Plus } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
  const memoProfessionals = useMemo(() => professionals, [professionals]);
  const memoCompany = useMemo(() => company, [company]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");

      if (companyId) {
        setSelectedCompanyId(companyId);

        const [professionalsData, servicesData, companyData, invoicesData, clientsData] =
          await Promise.all([
            fetch(`/api/invoice/professionals?companyId=${companyId}`).then((res) => res.json()),
            fetch(`/api/services`).then((res) => res.json()),
            fetch(`/api/companies`).then((res) => res.json()),
            fetch(`/api/invoice?companyId=${companyId}`).then((res) => res.json()),
            fetch(`/api/invoice/clients?companyId=${companyId}`).then((res) => res.json()),
          ]);

        const companyFiltered = (companyData as Company[]).find((c) => c.id === companyId);

        const sortedInvoices = [...(invoicesData as Invoice[])].sort(
          (a, b) => Number(b.invoice_number) - Number(a.invoice_number)
        );

        setInvoices(sortedInvoices);
        setClients(clientsData as Client[]);
        setProfessionals(professionalsData as Professional[]);
        setServices(servicesData as Service[]);
        setCompany(companyFiltered as Company);
      } else {
        setInvoices([]);
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

  const applyFilter = useCallback((data: Invoice[], filters: any) => {
    let filtered = [...data];

    const normalizeDate = (dateString: string) => {
      const d = new Date(dateString);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    if (filters.invoice_number) {
      filtered = filtered.filter((invoice) =>
        invoice.invoice_number?.toLowerCase().includes(filters.invoice_number.toLowerCase())
      );
    }

    if (filters.client_name) {
      filtered = filtered.filter((invoice) =>
        invoice?.client?.name.toLowerCase().includes(filters.client_name.toLowerCase())
      );
    }

    if (filters.start_date) {
      const start = normalizeDate(filters.start_date);
      filtered = filtered.filter((invoice) => normalizeDate(invoice.issue_date) >= start);
    }

    if (filters.end_date) {
      const end = normalizeDate(filters.end_date);
      filtered = filtered.filter((invoice) => normalizeDate(invoice.issue_date) <= end);
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === filters.status);
    }

    if (filters.total_amount) {
      filtered = filtered.filter((invoice) => invoice.total_amount === filters.total_amount);
    }

    return filtered;
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!activeFilters) return invoices;
    return applyFilter(invoices, activeFilters);
  }, [invoices, activeFilters, applyFilter]);

  const handleFilter = useCallback(
    (filters: any) => {
      setActiveFilters(filters);
    },
    [setActiveFilters]
  );

  const handleSave = async (invoiceData: Partial<Invoice>) => {
    try {
      const dataToSave = {
        ...invoiceData,
        companyId: selectedCompanyId,
      };

      if (editingInvoice) {
        const res = await fetch(`/api/invoice/${editingInvoice.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Erro ao editar invoice");

        const updated = await res.json();
        setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      } else {
        const res = await fetch(`/api/invoice`, {
          method: "POST",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Erro ao salvar invoice");
        const created = await res.json();
        setInvoices((prev) =>
          [created, ...prev].sort(
            (a, b) => Number(b.invoice_number) - Number(a.invoice_number)
          )
        );
      }

      await loadData();
      toast.success(`Nota Fiscal de serviço ${editingInvoice ? "atualizada" : "emitida"} com sucesso!`);
      setShowForm(false);
      setEditingInvoice(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar nota fiscal.");
    }
  };

  const handleStatusChange = useCallback(
    async (invoiceId: string, newStatus: string) => {
      try {
        const res = await fetch(`/api/invoice/${invoiceId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Erro ao atualizar status");
        }

        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: newStatus as InvoiceStatus } : inv
          )
        );

        toast.success("Status atualizado com sucesso!");
      } catch (error) {
        console.error(error);
        toast.error(String(error));
      }
    },
    []
  );

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
        <Alert className="bg-card border-border text-foreground rounded-2xl">
          <AlertDescription className="text-xs font-semibold text-muted-foreground">
            Por favor, selecione uma empresa no menu lateral para gerenciar as notas fiscais.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleEdit = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  }, []);

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
      "Número Nfs-e Substituída",
      "Provém de um RPS",
      "Data do RPS",
      "Número do RPS",
      "Natureza da Operação",
      "Cód. Serviço",
      "Local do Serviço",
    ];

    const rows = filteredInvoices.map((inv) => [
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

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

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
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[var(--banner-from)] via-[var(--banner-via)] to-[var(--banner-to)] border border-[var(--banner-border)] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Faturamento & NFS-e Hospitalar
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-primary" />
              Notas Fiscais de Serviço (NFS-e)
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie a emissão, retenções tributárias e acompanhamento de NFS-e da empresa
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={exportToCSV}
              className="bg-cyan-800/80 hover:bg-cyan-800 text-white hover:scale-105 transition-all duration-200 border-border rounded-xl text-xs font-semibold"
            >
              <ArrowDownFromLine className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              onClick={handleNew}
              disabled={!selectedCompanyId}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 border-none text-xs"
            >
              <Plus className="w-4 h-4 mr-2 stroke-[3]" />
              Emitir NFS-e
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <InvoiceFilters onFilter={handleFilter} />

      {/* Lista */}
      <Card className="bg-card border-card-border rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Histórico de Notas Fiscais
          </CardTitle>
          <div className="text-xs font-semibold text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-xl">
            Exibindo: <span className="text-primary font-bold">{filteredInvoices.length}</span> nota(s)
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-xs font-medium">
              <div className="animate-pulse">Carregando notas fiscais...</div>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <InvoiceItem
                  key={invoice.id}
                  invoice={invoice}
                  professionals={memoProfessionals}
                  company={memoCompany}
                  onEdit={handleEdit}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground text-sm">
              <FileText className="h-12 w-12 text-primary opacity-70 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Nenhuma nota fiscal encontrada</p>
              <p className="text-xs mt-1">Ajuste os filtros ou emita uma nova nota fiscal.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
      >
        <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingInvoice ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            <InvoiceForm
              invoice={editingInvoice}
              clients={clients}
              professionals={professionals}
              services={services}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingInvoice(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detalhes da Nota Fiscal
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {selectedInvoice && (
              <InvoiceDetails
                invoice={selectedInvoice}
                clients={clients}
                professionals={professionals}
                services={services}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
