"use client";

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AccountsReceivable, PaymentInstallment } from "@/src/types/payment"

interface PaymentFormProps {
  receivable: AccountsReceivable
  remainingAmount: number
  onSave: (data: Omit<PaymentInstallment, "id">) => Promise<void> | void;
  onCancel: () => void
}

export default function ReceivableForm({ receivable, remainingAmount, onSave, onCancel }: PaymentFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [amount, setAmount] = useState<number>(remainingAmount)
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [error, setError] = useState("")
  const [discount, setDiscount] = useState<number>(0)
  const [observations, setObservations] = useState<string>("")
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // previne duplo clique

    if (amount <= 0) {
      setError("O valor deve ser maior que zero.")
      return;
    }
    if (amount > remainingAmount) {
      setError(`O valor não pode ser maior que o saldo restante de R$ ${remainingAmount.toFixed(2)}.`)
      return;
    }
    if (discount < 0) {
      setError("O desconto não pode ser negativo.")
      return;
    }

    const totalWithDiscount = amount + discount;

    if (totalWithDiscount > remainingAmount) {
    setError(`Total (valor + desconto) de R$ ${totalWithDiscount.toFixed(2)} excede o saldo de R$ ${remainingAmount.toFixed(2)}.`);
      return;
    }

    setIsSaving(true)
    setError("")
    try {
      await onSave({
        accounts_receivable_id: receivable.id!,
        amount_paid: amount,
        payment_date: paymentDate,
        discount,
        observations
      })
    } catch (err) {
      console.error(err)
      setError("Ocorreu um erro ao registrar o recebimento. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const newAmount = remainingAmount - discount;
    setAmount(newAmount >= 0 ? newAmount : 0);
  }, [discount, remainingAmount]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-2 items-center gap-2">
        <label htmlFor="paymentDate">Data do Pagamento</label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
          className="justify-self-end w-37.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 space-y-2">
        <label htmlFor="amount">Valor Recebido R$</label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount.toFixed(2)}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          required
          className="text-right"
        />
        <label htmlFor="discount">- Desconto R$</label>
        <Input
          id="discount"
          type="number"
          step="0.01"
          value={discount.toFixed(2)}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          className="text-right"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="observations">Observações</label>
        <Input
          id="observations"
          type="text"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Registrando..." : "Registrar Pagamento"}
        </Button>
      </div>
    </form>
  )
}
