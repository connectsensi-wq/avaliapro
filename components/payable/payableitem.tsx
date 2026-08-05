"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, History, Lock, UserCheck, Calendar, FileText } from "lucide-react";
import { formatDate, toBRLDecimal } from "@/lib/utils";
import { AccountsPayable } from "@/src/types/payment";

interface PayableItemProps {
  acc: AccountsPayable;
  calculated: {
    receivableStatus: "pending" | "partially_paid" | "paid";
    totalPaid: number;
    totalDiscount: number;
    remainingAmount: number;
  };
  role: string;
  statusConfig: any;
  onOpenPayment: (acc: AccountsPayable) => void;
  onOpenHistory: (acc: AccountsPayable) => void;
}

function PayableItemComponent({
  acc,
  calculated,
  statusConfig,
  role,
  onOpenPayment,
  onOpenHistory,
}: PayableItemProps) {
  const { receivableStatus, totalPaid, totalDiscount, remainingAmount } = calculated;

  const receivable = acc.invoice?.accounts_receivable;
  const status = statusConfig[acc.status] || {
    label: "Desconhecido",
    color: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <Card className="bg-card py-0 border-card-border hover:border-primary/40 transition-all duration-200 rounded-2xl shadow-md overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="inline-flex items-center gap-1 font-bold text-primary bg-secondary px-2 py-0.5 rounded border border-border">
                <FileText className="w-3.5 h-3.5" /> NFS-e #{acc.document}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Emissão: {formatDate(acc.due_date)}
              </span>
              {acc.client_name && (
                <span className="truncate text-ellipsis text-foreground font-semibold">
                  • {acc.client_name}
                </span>
              )}
            </div>

            <Badge className={`${status.color} border px-3 py-0.5 rounded-full text-[11px] font-semibold`}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            {receivable && (
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${receivableStatus === "paid"
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                  : receivableStatus === "partially_paid"
                    ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                    : "bg-rose-500 shadow-sm shadow-rose-500/50"
                  }`}
                title={`Status do Recebimento do Cliente: ${receivableStatus === "paid"
                  ? "Recebido"
                  : receivableStatus === "partially_paid"
                    ? "Parcialmente Recebido"
                    : "Pendente de Recebimento"
                  }`}
              />
            )}
            <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary shrink-0" />
              {acc.professional_name}
            </h3>
          </div>

          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 font-mono">
            <div>
              Total Repasse: <strong className="text-foreground font-bold">R$ {toBRLDecimal(acc.amount.toFixed(2))}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="text-emerald-400">
              Pago: <strong>R$ {toBRLDecimal(totalPaid.toFixed(2))}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="text-sky-400">
              Descontos: <strong>R$ {toBRLDecimal(totalDiscount.toFixed(2))}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="text-rose-400">
              Restante: <strong>R$ {toBRLDecimal(remainingAmount.toFixed(2))}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:gap-4 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <Button
            size="sm"
            onClick={() => onOpenPayment(acc)}
            disabled={acc.status === "paid" || role !== "admin"}
            className={
              acc.status === "paid"
                ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed rounded-xl text-xs w-full sm:w-28"
                : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs shadow-md border-none w-full sm:w-28"
            }
          >
            {acc.status === "paid" ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Pago
              </>
            ) : (
              <>
                <DollarSign className="w-3.5 h-3.5 mr-1.5 stroke-[3]" /> Pagar
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenHistory(acc)}
            className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold w-full sm:w-28"
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            Histórico
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const PayableItem = React.memo(
  PayableItemComponent,
  (prev, next) => {
    return prev.acc === next.acc && prev.calculated === next.calculated;
  }
);