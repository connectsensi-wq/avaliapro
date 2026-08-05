"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AccountsReceivable, PaymentInstallment } from "@/src/types/payment";
import { toBRLDecimal } from "@/lib/utils";
import { Wallet, Calendar } from "lucide-react";

interface PaymentFormProps {
  receivable: AccountsReceivable;
  remainingAmount: number;
  onSave: (data: Omit<PaymentInstallment, "id">) => Promise<void> | void;
  onCancel: () => void;
}

export default function ReceivableForm({ receivable, remainingAmount, onSave, onCancel }: PaymentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState<number>(remainingAmount);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [observations, setObservations] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (amount <= 0) {
      setError("O valor deve ser maior que zero.");
      return;
    }
    if (amount > remainingAmount) {
      setError(`O valor não pode ser maior que o saldo restante de R$ ${remainingAmount.toFixed(2)}.`);
      return;
    }
    if (discount < 0) {
      setError("O desconto não pode ser negativo.");
      return;
    }

    const totalWithDiscount = amount + discount;

    if (totalWithDiscount > remainingAmount) {
      setError(`Total (valor + desconto) de R$ ${totalWithDiscount.toFixed(2)} excede o saldo de R$ ${remainingAmount.toFixed(2)}.`);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave({
        accounts_receivable_id: receivable.id!,
        amount_paid: amount,
        payment_date: paymentDate,
        discount,
        observations,
      });
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao registrar o recebimento. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const newAmount = remainingAmount - discount;
    setAmount(newAmount >= 0 ? newAmount : 0);
  }, [discount, remainingAmount]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-foreground pt-2">
      {error && (
        <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/30 text-rose-400 rounded-xl">
          <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      <div className="p-4 bg-secondary/40 border border-border rounded-xl space-y-1.5 text-xs">
        <h4 className="font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-primary" /> Resumo do Faturamento
        </h4>
        <div className="text-muted-foreground flex justify-between items-center pt-1">
          <span>Saldo Restante a Receber:</span>
          <strong className="text-sm font-extrabold text-primary font-mono">
            R$ {toBRLDecimal(remainingAmount.toFixed(2))}
          </strong>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paymentDate" className="text-xs font-medium text-muted-foreground">
          Data do Recebimento *
        </Label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
          className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
            Valor Recebido (R$) *
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount.toFixed(2)}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            required
            className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono text-right"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount" className="text-xs font-medium text-muted-foreground">
            Desconto (R$)
          </Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            value={discount.toFixed(2)}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono text-right"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observations" className="text-xs font-medium text-muted-foreground">
          Observações
        </Label>
        <Input
          id="observations"
          type="text"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Observações do recebimento..."
          className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-sidebar-primary hover:bg-cyan-800 text-primary-foreground hover:text-white font-bold px-6 rounded-xl text-xs shadow-md border-none"
        >
          {isSaving ? "Registrando..." : "Registrar Recebimento"}
        </Button>
      </div>
    </form>
  );
}
