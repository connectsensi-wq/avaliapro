"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AccountsPayable, PaymentPayableInstallment } from "@/src/types/payment";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { formatDate, toBRLDecimal } from "@/lib/utils";

interface HistoryDialogProps {
  payable: AccountsPayable;
  installments: PaymentPayableInstallment[];
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void> | void;
  role: string
}

export function HistoryDialog({ 
  payable, 
  installments, 
  onCancel, 
  onDelete,
  role
}: HistoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const handleDelete = async (installmentId: string) => {
    if (isDeleting) return; // evita múltiplos cliques simultâneos
    const confirmed = confirm("Tem certeza que deseja excluir esta parcela?");
    if (!confirmed) return;

    setIsDeleting(installmentId);
    try {
      if (onDelete) await onDelete(installmentId);
      onCancel();
    } catch (err) {
      console.error("Erro ao excluir parcela:", err);
      alert("Ocorreu um erro ao excluir a parcela. Tente novamente.");
    } finally {
      setIsDeleting(null);
    }
  }
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de Pagamentos - {payable.document}</DialogTitle>
          <DialogDescription>
            Valor Bruto: R$ {toBRLDecimal((payable.gross_amount || 0).toFixed(2))} / Valor do Repasse: R$ {toBRLDecimal(payable.amount.toFixed(2))}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto space-y-3 pr-2">
          {installments.length > 0 ? (
            installments.map(inst => (
            <div key={inst.id} className="grid grid-cols-5 gap-4 border rounded-lg bg-slate-50 min-w-0">
              <div className="p-3 col-span-4 wrap-break-words">
                <p><strong>Data:</strong> {formatDate(inst.payment_date)}</p>
                <p><strong>Valor Pago:</strong> R$ {toBRLDecimal(inst.amount_paid.toFixed(2))}</p>
                    {Number(inst.discount) > 0 && (
                      <p>
                        <strong>Desconto:</strong> R$ {toBRLDecimal(inst.discount?.toFixed(2))}
                      </p>
                    )}
                    
                    {inst.observations && (
                      <p className="text-slate-600">
                        <strong>Obs:</strong> {inst.observations}
                      </p>
                    )}
              </div>
              <div className="col-span-1 flex justify-center mt-4 mr-4">
                  <Button 
                      type="button" 
                      variant="ghost"
                      size = "lg" 
                      onClick={() => handleDelete(inst.id)}
                      disabled={isDeleting === inst.id || role !== "admin"}
                      className="text-red-600 hover:text-red-700 p-2 flex items-center justify-center h-10 w-21"
                  >
                    {isDeleting === inst.id ? (
                      <span className="animate-pulse text-slate-500">
                        Excluindo...
                      </span>
                    ) : (
                      <>
                        <Trash2 size={20} />
                        Excluir
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">Nenhum pagamento registrado.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
