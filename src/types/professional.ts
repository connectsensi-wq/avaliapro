import { Specialty } from "./entities";
import { 
  AccountType, 
  AddressType, 
  PixKeyType, 
  State, 
  Status 
} from "./enums";
import { InvoiceServiceItem } from "./invoice";
import { AccountsPayable } from "./payment";

export interface Professional {
  id: string;
  companyId: string;
  code: string;
  name: string;
  cpf: string;
  clerkUserId?: string;
  registration_number?: string | null;
  birthday?: string;

  specialty?: Specialty | null;
  specialtyId?: string | null;

  phone?: string | null;
  email?: string | null;

  // 🔹 Dados bancários
  bank?: string | null;
  agency?: string | null;
  account?: string | null;
  account_type?: AccountType | null;

  // 🔹 PIX
  pix_key_type?: PixKeyType | null;
  pix_key?: string | null;

  // 🔹 Endereço
  address_type?: AddressType | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: State | null;
  cep?: string | null;

  admin_fee_percentage: number;
  status: Status;

  invoiceServiceItems?: InvoiceServiceItem[]
  accounts_payable?: AccountsPayable[]
}