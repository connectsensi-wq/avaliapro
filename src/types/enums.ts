// =============================
// ENUMS
// =============================
export type DocumentType = "cpf" | "cnpj"

export type AddressType = 
  | "alameda" | "avenida" | "estrada" | "loteamento" | "praça" 
  | "quadra" | "rodovia" | "rua" | "travessa" 

export type State =
  | "AC" | "AL" | "AM" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA"
  | "MG" | "MS" | "MT" | "PA" | "PB" | "PE" | "PI" | "PR" | "RJ"
  | "RN" | "RO" | "RR" | "RS" | "SC" | "SE" | "SP" | "TO"

export type Status = "active" | "inactive"

export type AccountType = "corrente" | "poupanca"

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random"

export type OperationNature = 
  | "imune" | "isento" | "tributacao_fora_do_municipio" | "tributacao_no_municipio"
  | "exigibilidade_suspensa_judicial" | "exigibilidade_suspensa_administrativa" 

export type YesNo = "sim" | "nao"

export type InvoiceStatus = "regular" | "cancelada" | "pendente_de_cancelamento"

export type AccountsReceivableStatus = "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"

export type AccountsPayableStatus = "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"
