"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AccountsReceivable, PaymentInstallment } from "@/src/types/payment";
import { Button } from "../ui/button";
import { Trash2, History, Calendar, Wallet } from "lucide-react";
import { formatDate, toBRLDecimal } from "@/lib/utils";

interface HistoryDialogProps {
  receivable: AccountsReceivable;
  installments: PaymentInstallment[];
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void> | void;
}

export default function HistoryDialog({
  receivable,
  installments,
  onCancel,
  onDelete,
}: HistoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (installmentId: string) => {
    if (isDeleting) return;
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
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-xl bg-card border-border text-foreground shadow-2xl rounded-2xl p-6">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Recebimentos - NFS-e #{receivable.document}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-mono mt-1">
            Valor Total Faturado: <strong className="text-primary font-bold">R$ {toBRLDecimal(receivable.amount.toFixed(2))}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar pt-2">
          {installments.length > 0 ? (
            installments.map((inst) => (
              <div
                key={inst.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm hover:border-border/80 transition-colors"
              >
                <div className="space-y-1.5 text-xs text-muted-foreground flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Data do Recebimento: {formatDate(inst.payment_date)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">
                      R$ {toBRLDecimal(inst.amount_paid.toFixed(2))}
                    </span>
                    {Number(inst.discount) > 0 && (
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Desconto: R$ {toBRLDecimal(inst.discount?.toFixed(2))}
                      </span>
                    )}
                  </div>

                  {inst.observations && (
                    <p className="text-muted-foreground text-[11px] bg-secondary/40 p-2 rounded-lg border border-border mt-1">
                      <strong className="text-foreground">Obs:</strong> {inst.observations}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(inst.id)}
                  disabled={isDeleting === inst.id}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-500 border-rose-500/30 rounded-xl text-xs font-semibold shrink-0"
                >
                  {isDeleting === inst.id ? (
                    <span className="animate-pulse text-muted-foreground">Excluindo...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Excluir
                    </>
                  )}
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground bg-card border border-border rounded-xl">
              <Wallet className="w-8 h-8 text-primary opacity-60 mx-auto mb-2" />
              Nenhum pagamento registrado para esta conta.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
