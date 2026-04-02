"use client";

import React from "react";
import { AccountsReceivable } from "@/src/types/payment";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { DollarSign, History, Lock } from "lucide-react";
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
    const remainingAmount = round(round(acc.amount) - round(totalPaid) - round(totalDiscount)
    );

    return(
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="grid grid-cols-[75%_25%]">
                <p className="text-md text-slate-500">
                  NFS-e: {acc.document} - Emissão: {formatDate(acc.due_date)}
                </p>
                <div className="flex items-center justify-center">
                  <Badge className={`min-w-25 text-center ${status.color}`}>
                    {status.label}
                  </Badge>
                </div>
              </div>

              <h3 className="font-semibold">{acc.client_name}</h3>

              <div className="text-sm mt-2 border-t pt-3">
                <span>Total: R$ {toBRLDecimal(acc.amount.toFixed(2))}</span>
                <span className="mx-2">|</span>
                <span className="text-green-600">
                  Recebido: R$ {toBRLDecimal(totalPaid.toFixed(2))}
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
                onClick={() => onOpenHistory(acc)}
              >
                <History className="w-4 h-4 mr-1" />
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
