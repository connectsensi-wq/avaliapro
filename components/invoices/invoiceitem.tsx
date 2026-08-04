"use client";

import React from "react";
import { Invoice } from "@/src/types/invoice";
import { Professional } from "@/src/types/professional";
import { Company } from "@/src/types/company";
import { Button } from "../ui/button";
import { Edit, Lock, FileText, UserCheck, Calendar } from "lucide-react";
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
  return (
    <div className="p-4 sm:p-5 hover:bg-secondary/40 transition-colors border-b border-border last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 text-white bg-secondary hover:bg-slate-300 border border-border rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <InvoicePrintMulti
              invoice={invoice}
              professionals={professionals}
              company={company}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                Demonstrativo NFS-e #{invoice.invoice_number}
              </h4>

              {invoice.locked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                  <Lock className="w-3 h-3" /> Bloqueada
                </span>
              )}

              <StatusUpdater
                invoiceId={invoice.id}
                currentStatus={invoice.status}
                onStatusChange={onStatusChange}
                locked={invoice.locked}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {invoice?.client?.name && (
                <div className="flex items-center gap-1 text-foreground font-medium">
                  <span className="text-muted-foreground font-normal">Cliente:</span>{" "}
                  <span className="truncate">{invoice.client.name}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Emissão: {formatDate(invoice.issue_date)}</span>
              </div>

              <div className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Profissionais: {invoice.service_items?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
          <div className="text-right font-mono">
            <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">
              Valor Total
            </span>
            <span className="text-sm sm:text-base font-extrabold text-primary">
              {invoice.total_amount != null ? (
                `R$ ${toBRLDecimal(invoice.total_amount.toFixed(2))}`
              ) : (
                "-"
              )}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(invoice)}
            className="bg-secondary hover:bg-cyan-800 text-primary hover:text-white border-border rounded-xl text-xs font-semibold"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
          </Button>
        </div>
      </div>
    </div>
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