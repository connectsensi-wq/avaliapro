import { Client } from "./client"
import { AddressType, State, Status } from "./enums"
import { Invoice } from "./invoice"
import { AccountsPayable, AccountsReceivable } from "./payment"
import { Professional } from "./professional"

export interface Company {
  id: string
  code: string
  document: string
  document_type: DocumentType
  name: string
  fantasy_name?: string
  address_type?: AddressType
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  cep?: string
  state?: State
  ddd?: string
  phone?: string
  email?: string
  state_registration?: string
  municipal_registration?: string
  constitution_date?: Date
  status: Status

  professionals?: Professional[]
  clients?: Client[]
  invoices?: Invoice[]
  accounts_receivable?: AccountsReceivable[]
  accounts_payable?: AccountsPayable[]
}