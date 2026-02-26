"use client";

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AccountsReceivable, PaymentInstallment } from "@/src/types/payment"

interface PaymentFormProps {
  receivable: AccountsReceivable
  remainingAmount: number
  onSave: (payment: Omit<PaymentInstallment, "id">) => Promise<void> | void
  onCancel: () => void
}

export default function ReceivableForm({ receivable, remainingAmount, onSave, onCancel }: PaymentFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [amount, setAmount] = useState<number>(remainingAmount)
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [error, setError] = useState("")

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

    setIsSaving(true)
    setError("")
    try {
      await onSave({
        accounts_receivable_id: receivable.id!,
        amount_paid: amount,
        payment_date: paymentDate
      })
    } catch (err) {
      console.error(err)
      setError("Ocorreu um erro ao registrar o pagamento. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="space-y-2">
        <label htmlFor="paymentDate">Data do Pagamento</label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="amount">Valor Recebido</label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount.toFixed(2)}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          required
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
