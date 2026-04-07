"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, History, Lock } from "lucide-react";
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
  statusConfig: any;
  onOpenPayment: (acc: AccountsPayable) => void;
  onOpenHistory: (acc: AccountsPayable) => void;
}

function PayableItemComponent({
  acc,
  calculated,
  statusConfig,
  onOpenPayment,
  onOpenHistory,
}: PayableItemProps) {
  const { receivableStatus, totalPaid, totalDiscount, remainingAmount } = calculated;

  const receivable = acc.invoice?.accounts_receivable;
  const status = statusConfig[acc.status] || {
    label: "Desconhecido",
    color: "bg-gray-200",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-[75%_25%]">
            <p className="text-md text-slate-500">
              NFS-e: {acc.document} - Emissão: {formatDate(acc.due_date)} - {acc.client_name}
            </p>
            <div className="flex items-center justify-center">
              <Badge className={`min-w-25 text-center ${status.color}`}>
                {status.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {receivable && (
              <>
                {receivableStatus === "paid" && <span className="w-3 h-3 rounded-full bg-green-500" />}
                {receivableStatus === "partially_paid" && <span className="w-3 h-3 rounded-full bg-yellow-500" />}
                {receivableStatus === "pending" && <span className="w-3 h-3 rounded-full bg-red-500" />}
              </>
            )}
            <h3 className="font-semibold">{acc.professional_name}</h3>
          </div>

          <div className="text-sm mt-2 border-t pt-3">
            <span>Total: R$ {toBRLDecimal(acc.amount.toFixed(2))}</span>
            <span className="mx-2">|</span>
            <span className="text-green-600">
              Pago: R$ {toBRLDecimal(totalPaid.toFixed(2))}
            </span>
            <span className="mx-2">|</span>
            <span className="text-blue-600">
              Descontos: R$ {toBRLDecimal(totalDiscount.toFixed(2))}
            </span>
            <span className="mx-2">|</span>
            <span className="text-red-600">
              Restante: R$ {toBRLDecimal(remainingAmount.toFixed(2))}
            </span>
          </div>
        </div>

        <div className="grid grid-rows-2 gap-4">
          <Button
            size="sm"
            onClick={() => onOpenPayment(acc)}
            disabled={acc.status === "paid"}
            className={acc.status === "paid" ? "opacity-50 cursor-not-allowed" : ""}
          >
            {acc.status === "paid" ? (
              <Lock className="w-4 h-4 mr-1" />
            ) : (
              <DollarSign className="w-4 h-4 mr-1" />
            )}
            Pagar
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onOpenHistory(acc)}>
            <History className="w-4 h-4 mr-1" />
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
    return prev.acc === next.acc &&
           prev.calculated === next.calculated;
  }
);