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
import { Trash2 } from "lucide-react";
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
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg w-full py-2">
        <DialogHeader>
          <DialogTitle>
            Histórico de Pagamentos - NFS-e {receivable.document}
          </DialogTitle>
          <DialogDescription>
            Valor Total: R$ {toBRLDecimal(receivable.amount.toFixed(2))}
          </DialogDescription>
        </DialogHeader>

        {installments.length > 0 ? (
          // CONTÊINER ROLÁVEL ADICIONADO AQUI
          <div className="max-h-[80vh] overflow-y-auto space-y-3 pr-2"> 
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="grid grid-cols-5 gap-4 border rounded-lg bg-slate-50 min-w-0"
              >
                <div className="p-3 col-span-4 break-words">
                  <p>
                    <strong>Data:</strong>{" "}
                    {formatDate(inst.payment_date)}
                  </p>
                  <p>
                    <strong>Valor Pago:</strong> R${" "}
                    {toBRLDecimal(inst.amount_paid.toFixed(2))}
                  </p>
                </div>
                <div className="col-span-1 flex justify-center mt-4 mr-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => handleDelete(inst.id)}
                    disabled={isDeleting === inst.id}
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
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">
            Nenhum pagamento registrado.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
