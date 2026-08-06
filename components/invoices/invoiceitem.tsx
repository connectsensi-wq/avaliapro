"use client";

import React from "react";
import { Invoice } from "@/src/types/invoice";
import { Professional } from "@/src/types/professional";
import { Company } from "@/src/types/company";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Lock, FileText, UserCheck, Calendar, Building2, Receipt } from "lucide-react";
import { formatDate, toBRLDecimal } from "@/lib/utils";
import InvoicePrintMulti from "./invoiceprint";
import StatusUpdater from "./statusupdater";

interface InvoiceItemProps {
  invoice: Invoice;
  professionals: Professional[];
  company: Company | null;
  onEdit: (invoice: Invoice) => void;
  onStatusChange: (invoiceId: string, status: string) => void;
}

function InvoiceItemComponent({
  invoice,
  professionals,
  company,
  onEdit,
  onStatusChange,
}: InvoiceItemProps) {
  const totalRetentions = invoice.total_retentions || 0;
  const baseAmount = invoice.base_amount || invoice.total_amount || 0;

  return (
    <Card className="bg-card py-0 border-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 rounded-2xl shadow-xl overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Lado Esquerdo - Informações da NFS-e */}
        <div className="flex-1 min-w-0 space-y-2.5 w-full">
          {/* Barra Superior com Número da Nota, Data e Status */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary hover:bg-cyan-800 hover:cursor-pointer transition-all duration-200">
                <InvoicePrintMulti
                  invoice={invoice}
                  professionals={professionals}
                  company={company}
                />
              </div>
              <span className="inline-flex items-center gap-1 font-bold text-primary bg-secondary px-2.5 py-0.5 rounded border border-border">
                <Receipt className="w-3.5 h-3.5" /> NFS-e #{invoice.invoice_number}
              </span>

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Emissão: {formatDate(invoice.issue_date)}
              </span>

              {invoice.service_code && (
                <span className="hidden md:inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded text-[11px]">
                  Cód: {invoice.service_code}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {invoice.locked && (
                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueada
                </Badge>
              )}

              <StatusUpdater
                invoiceId={invoice.id}
                currentStatus={invoice.status}
                onStatusChange={onStatusChange}
                locked={invoice.locked}
              />
            </div>
          </div>

          {/* Nome do Cliente & Descrição do Serviço */}
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{invoice.client?.name || "Cliente não informado"}</span>
            </h3>

            {invoice.service_description && (
              <p className="text-xs text-muted-foreground line-clamp-1 italic">
                {invoice.service_description}
              </p>
            )}
          </div>

          {/* Detalhamento Financeiro (Font Mono) */}
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-mono">
            <div className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span>Profissionais: <strong className="text-foreground font-bold">{invoice.service_items?.length || 0}</strong></span>
            </div>
            <span className="text-border">|</span>
            <div>
              Base: <strong className="text-foreground">R$ {toBRLDecimal(baseAmount.toFixed(2))}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="text-rose-400">
              Retenções: <strong>R$ {toBRLDecimal(totalRetentions.toFixed(2))}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="text-primary font-bold">
              Valor Total: <strong className="text-primary text-sm font-extrabold">R$ {invoice.total_amount != null ? toBRLDecimal(invoice.total_amount.toFixed(2)) : "0,00"}</strong>
            </div>
          </div>
        </div>

        {/* Lado Direito - Botões de Ação */}
        <div className="flex flex-row sm:flex-col items-stretch sm:items-end justify-between gap-2.5 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
          <div className="w-full sm:w-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(invoice)}
              className="bg-secondary hover:bg-cyan-800 text-primary hover:text-white border-border rounded-xl text-xs font-semibold px-4 h-9 flex-1 sm:flex-initial"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const InvoiceItem = React.memo(
  InvoiceItemComponent,
  (prev, next) => {
    return (
      prev.invoice.id === next.invoice.id &&
      prev.invoice.status === next.invoice.status &&
      prev.invoice.total_amount === next.invoice.total_amount &&
      prev.invoice.issue_date === next.invoice.issue_date &&
      prev.invoice.locked === next.invoice.locked &&
      prev.invoice.invoice_number === next.invoice.invoice_number &&
      prev.invoice.client?.name === next.invoice.client?.name &&
      prev.professionals === next.professionals &&
      prev.company === next.company
    );
  }
);

export default InvoiceItem;