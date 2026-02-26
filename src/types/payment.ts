import { AccountsPayableStatus, AccountsReceivableStatus } from "./enums"
import { Client } from "./client"
import { Professional } from "./professional"
import { Invoice } from "./invoice"

export interface AccountsReceivable {
  id?: string
  companyId?: string
  invoice_id?: string
  client?: Client
  client_id: string
  client_name?: string
  document?: string
  description: string
  amount: number
  due_date: string
  payment_date?: string
  status: AccountsReceivableStatus

  installments?: PaymentInstallment[]
}

export interface AccountsPayable {
  id?: string
  companyId?: string
  invoice_id?: string
  invoice?: Invoice
  professional?: Professional
  professional_id: string
  professional_name?: string
  client_name?: string,
  document?: string
  description: string
  gross_amount?: number
  admin_fee_percentage?: number
  admin_fee_amount?: number
  amount: number
  due_date: string
  payment_date?: string
  status: AccountsPayableStatus

  installments?: PaymentPayableInstallment[]
}

export interface PaymentInstallment {
  id: string
  accounts_receivable_id: string
  payment_date: string
  amount_paid: number
}

export interface PaymentPayableInstallment {
  id: string
  accounts_payable_id: string
  payment_date: string
  amount_paid: number
}