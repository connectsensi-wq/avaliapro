import { AddressType, State, Status, DocumentType } from "@/lib/generated/prisma";
import { Invoice } from "./invoice";
import { AccountsReceivable } from "./payment";

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface Client {
  id: string;
  companyId: string;
  code: string;
  document: string;
  document_type: DocumentType;
  name: string;
  fantasy_name?: string | null;
  address_type?: AddressType | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  cep?: string | null;
  state?: State | null;
  ddd?: string | null;
  phone?: string | null;
  email?: string | null;
  state_registration?: string | null;
  municipal_registration?: string | null;
  is_simple_national_optant: boolean;
  status: Status;

  contacts?: ClientContact[]
  invoices?: Invoice[]
  accounts_receivable?: AccountsReceivable[]
}
