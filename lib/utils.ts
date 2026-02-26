import { YesNo } from "@/src/types/enums";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCpf(cpf: any) {
  if (!cpf) return "";
  const numbers = cpf.replace(/\D/g, "");
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export function formatPhone(phone?: any) {
  if (!phone) return "";
  
  const formattedPhone = phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return formattedPhone;
};

export function formatDocument (value: string, type: string) {
  const numbers = value.replace(/\D/g, '');
  if (type === "cpf") return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const states = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MG", label: "Minas Gerais" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MT", label: "Mato Grosso" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "PR", label: "Paraná" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SE", label: "Sergipe" },
  { value: "SP", label: "São Paulo" },
  { value: "TO", label: "Tocantins" },
];

export const addressTypes = [
  { value: "alameda", label: "Alameda" }, 
  { value: "avenida", label: "Avenida" },
  { value: "estrada", label: "Estrada" },
  { value: "loteamento", label: "Loteamento" },
  { value: "praça", label: "Praça" }, 
  { value: "quadra", label: "Quadra" }, 
  { value: "rodovia", label: "Rodovia" },
  { value: "rua", label: "Rua" },
  { value: "travessa", label: "Travessa" }, 
];

export const pixKeyTypes = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Número telefone" },
  { value: "random", label: "Chave Aleatória" }
];

export const operationNatures = [
    { value: "imune", label: "Imune"},
    { value: "isento", label: "Isento"},
    { value: "tributacao_no_municipio", label: "Tributação no município"},
    { value: "tributacao_fora_do_municipio", label: "Tributação fora do município" },
    { value: "exigibilidade_suspensa_judicial", label: "Exigibilidade suspensa por decisão judicial"},
    { value: "exigibilidade_suspensa_administrativa", label: "Exigibilidade suspensa por procedimento administrativo"},
];

export const yesNoToSimNao = (value?: YesNo | "sim" | "não"): "sim" | "não" => {
    if (value === "sim") return "sim";
    return "não"; // qualquer outro valor (undefined ou "nao") vira "não"
};

export const toYesNoEnum = (value?: YesNo | "sim" | "não"): YesNo => {
    return value === "sim" ? "sim" : "nao"; // qualquer outro valor vira "nao"
}

export const falseTruetoSimNao = (value: boolean) => {
    if (value === true) return "Sim"
    return "Não";
}

export const toInputDate = (isoDate: string) => isoDate.split("T")[0];

export function toBRLDecimal(value: any): string {
  if (value === null || value === undefined) return "";

  // garante que está trabalhando como número
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "";

  // formata para o padrão brasileiro
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 20, // pode ajustar se quiser limitar casas
  });
}

export function parseLocalDate(dateValue: string | Date | null | undefined) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue; // já é uma data válida

  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day); // cria no horário local
}

export const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};