"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
} from "lucide-react";
import { Company } from "@/src/types/company";
import { addressTypes, formatDocument, formatPhone, states } from "@/lib/utils";

interface CompanyDetailsProps {
  company: Company;
}

export default function CompanyDetails({ company }: CompanyDetailsProps) {
  const getFullAddress = () => {
    const typeLabel = addressTypes.find((a) => a.value === company.address_type)?.label || "";
    const stateLabel = states.find((s) => s.value === company.state)?.label || company.state || "";

    const parts = [
      typeLabel,
      company.street,
      company.number,
      company.complement,
      company.neighborhood,
      company.cep,
      company.city,
      stateLabel,
    ]
      .filter(Boolean)
      .join(", ");
    return parts || "Endereço não informado";
  };

  const docTypeStr = company.document_type?.toString().toUpperCase() || "CNPJ";

  return (
    <div className="space-y-4 font-sans text-foreground py-2">
      {/* Header Info */}
      <div className="flex items-center gap-4 bg-banner-via border border-border p-4 rounded-xl">
        <div className="w-12 h-12 bg-banner_via border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
          <Building2 className="w-6 h-6 text-sidebar-primary" />
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white truncate">{company.name}</h2>
            <Badge
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${company.status === "active"
                ? "bg-sidebar-primary/10 text-sidebar-primary border-primary/30"
                : "bg-secondary text-muted-foreground border-border"
                }`}
            >
              {company.status === "active" ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          {company.fantasy_name && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{company.fantasy_name}</p>
          )}
          <p className="text-[11px] font-mono text-sidebar-primary mt-1">
            {docTypeStr}: {formatDocument(company.document, company.document_type?.toString() || "cnpj")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dados Fiscais */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Dados Fiscais & Registro</h3>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p className="font-mono flex justify-between">
              <span>Código:</span> <span className="text-foreground font-semibold">#{company.code}</span>
            </p>
            {company.state_registration && (
              <p className="font-mono flex justify-between">
                <span>Inscrição Estadual:</span> <span className="text-foreground font-semibold">{company.state_registration}</span>
              </p>
            )}
            {company.municipal_registration && (
              <p className="font-mono flex justify-between">
                <span>Inscrição Municipal:</span> <span className="text-foreground font-semibold">{company.municipal_registration}</span>
              </p>
            )}
            {company.constitution_date && (
              <p className="font-mono flex justify-between">
                <span>Data de Constituição:</span> <span className="text-foreground font-semibold">{new Date(company.constitution_date).toLocaleDateString("pt-BR")}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contato Principal */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Contato Comercial</h3>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2 truncate" title={company.email || undefined}>
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate text-foreground">{company.email || "Sem e-mail cadastrado"}</span>
            </p>
            {(company.ddd || company.phone) && (
              <p className="flex items-center gap-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" /> ({company.ddd}) {company.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Endereço Sede</h3>
        <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="leading-relaxed text-foreground">{getFullAddress()}</p>
        </div>
      </div>
    </div>
  );
}
