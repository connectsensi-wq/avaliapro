import { InvoiceStatus, OperationNature, YesNo } from "./enums"
import { AccountsPayable, AccountsReceivable } from "./payment"
import { Client } from "./client"

export interface Invoice {
  id: string
  companyId: string
  client_id: string
  invoice_number: string
  issue_date: string
  tax_retained: boolean
  operation_nature: OperationNature
  service_code: string
  service_location: string
  is_substitute: YesNo
  substitute_number?: string
  from_rps: YesNo
  rps_number?: string
  rps_date?: string
  base_amount: number
  tax_rate: number
  iss_amount: number
  total_amount: number
  total_retentions: number
  observations?: string
  status: InvoiceStatus
  locked: boolean

  service_items?: InvoiceServiceItem[]
  retentions?: Retentions
  accounts_receivable?: AccountsReceivable
  accounts_payable?: AccountsPayable[]
  client?: Client
  client_name?: string
}

export interface InvoiceServiceItem {
  id: string
  invoice_id?: string
  professional_id: string
  professional_name?: string
  service_value: number
  description: string
  sequence?: number
}

export interface Retentions {
  id?: string
  invoice_id: string
  inss_percentage: number
  inss: number
  irpj_percentage: number
  irpj: number
  csll_percentage: number
  csll: number
  cofins_percentage: number
  cofins: number
  pis_pasep_percentage: number
  pis_pasep: number
  other_retentions_percentage: number
  other_retentions: number
}