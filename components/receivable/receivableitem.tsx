"use client";

import React from "react";
import { AccountsReceivable } from "@/src/types/payment";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { DollarSign, History, Lock, Building2, Calendar, FileText } from "lucide-react";
import { formatDate, toBRLDecimal } from "@/lib/utils";

interface Props {
  acc: AccountsReceivable;
  status: { label: string; color: string };
  onOpenPayment: (acc: AccountsReceivable) => void;
  onOpenHistory: (acc: AccountsReceivable) => void;
}

function ReceivableItemComponent({
  acc,
  status,
  onOpenPayment,
  onOpenHistory,
}: Props) {
  const totalPaid = acc.installments?.reduce((sum, i) => sum + i.amount_paid, 0) || 0;
  const totalDiscount = acc.installments?.reduce((sum, i) => sum + (i.discount || 0), 0) || 0;
  const round = (v: number) => Number(v.toFixed(2));
  const remainingAmount = round(round(acc.amount) - round(totalPaid) - round(totalDiscount));

  return (
    <Card className="bg-card border-card-border hover:border-primary/40 transition-all duration-200 rounded-2xl shadow-md overflow-hidden">
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
            </div>

            <Badge className={`${status.color} border px-3 py-0.5 rounded-full text-[11px] font-semibold`}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              {acc.client_name}
            </h3>
          </div>

          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 font-mono">
            <div>
              Total Faturado: <strong className="text-foreground font-bold">R$ {toBRLDecimal(acc.amount.toFixed(2))}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="text-emerald-400">
              Recebido: <strong>R$ {toBRLDecimal(totalPaid.toFixed(2))}</strong>
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

        <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <Button
            size="sm"
            onClick={() => onOpenPayment(acc)}
            disabled={acc.status === "paid"}
            className={
              acc.status === "paid"
                ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed rounded-xl text-xs w-full sm:w-28"
                : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs shadow-md border-none w-full sm:w-28"
            }
          >
            {acc.status === "paid" ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Recebido
              </>
            ) : (
              <>
                <DollarSign className="w-3.5 h-3.5 mr-1.5 stroke-[3]" /> Receber
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

const ReceivableItem = React.memo(
  ReceivableItemComponent,
  (prev, next) => {
    return prev.acc === next.acc;
  }
);

export default ReceivableItem;
