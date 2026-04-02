"use client";

import React from "react";
import { Invoice } from "@/src/types/invoice";
import { Professional } from "@/src/types/professional";
import { Company } from "@/src/types/company";
import { Button } from "../ui/button";
import { Edit, Lock } from "lucide-react";
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
    <div className="p-4 hover:bg-slate-50 transition-colors">
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
                <Lock
                  className="w-3 h-3 text-slate-400"
                  aria-label="Nota fiscal bloqueada"
                />
              )}

              <StatusUpdater
                invoiceId={invoice.id}
                currentStatus={invoice.status}
                onStatusChange={onStatusChange}
                locked={invoice.locked}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
              <div>
                <span className="font-medium">Data:</span>{" "}
                {formatDate(invoice.issue_date)}
              </div>

              <div>
                <span className="font-medium">Valor:</span>
                {invoice.total_amount != null ? (
                  <span className="font-semibold text-slate-900 ml-1">
                    R$ {toBRLDecimal(invoice.total_amount.toFixed(2))}
                  </span>
                ) : (
                  <span className="ml-1">-</span>
                )}
              </div>

              <div>
                <span className="font-medium">Participante:</span>{" "}
                {invoice.service_items?.length || 0}
              </div>
            </div>

            <div>
              <span className="font-medium">Cliente:</span>{" "}
              {invoice?.client?.name}
            </div>
          </div>
        </div>

        <div className="flex gap-2 ml-4 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(invoice)}
            className="px-3"
          >
            <Edit className="w-4 h-4 mr-1" /> Editar
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